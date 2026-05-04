// Markdown → Word converter for iFare docs.
// Reads every iFare_*.md in /docs and writes a same-named .docx using `marked` + `docx`.
// Run from repo root: `node scripts/convert-docs.mjs`

import { marked } from 'marked';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
} from 'docx';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(REPO_ROOT, 'docs');

const HEADING_MAP = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
  5: HeadingLevel.HEADING_5,
  6: HeadingLevel.HEADING_6,
};

const MONO_FONT = 'Consolas';
const ZH_FONT = 'Microsoft JhengHei';

function inlineToRuns(tokens, opts = {}) {
  const runs = [];
  for (const t of tokens || []) {
    switch (t.type) {
      case 'text':
        if (t.tokens) {
          runs.push(...inlineToRuns(t.tokens, opts));
        } else {
          runs.push(new TextRun({ text: t.text, ...opts }));
        }
        break;
      case 'strong':
        runs.push(...inlineToRuns(t.tokens, { ...opts, bold: true }));
        break;
      case 'em':
        runs.push(...inlineToRuns(t.tokens, { ...opts, italics: true }));
        break;
      case 'codespan':
        runs.push(new TextRun({ text: t.text, font: MONO_FONT, ...opts }));
        break;
      case 'link':
        runs.push(...inlineToRuns(t.tokens, { ...opts, color: '0563C1', underline: {} }));
        break;
      case 'br':
        runs.push(new TextRun({ break: 1 }));
        break;
      case 'del':
        runs.push(...inlineToRuns(t.tokens, { ...opts, strike: true }));
        break;
      case 'html':
        // Skip HTML tags; emit raw text only if it has visible content.
        if (t.text && !/^<[^>]+>$/.test(t.text.trim())) {
          runs.push(new TextRun({ text: t.text, ...opts }));
        }
        break;
      default:
        if (t.text) runs.push(new TextRun({ text: t.text, ...opts }));
    }
  }
  return runs;
}

function listItemRuns(item) {
  // Try to find inline tokens; marked nests differently for tight vs loose lists.
  if (item.tokens && item.tokens[0]) {
    const first = item.tokens[0];
    if (first.tokens) return inlineToRuns(first.tokens);
    if (first.type === 'text') return [new TextRun({ text: first.text || '' })];
  }
  return [new TextRun({ text: item.text || '' })];
}

function blockToDocx(token, depth = 0) {
  switch (token.type) {
    case 'heading':
      return [
        new Paragraph({
          heading: HEADING_MAP[token.depth] || HeadingLevel.HEADING_6,
          children: inlineToRuns(token.tokens),
        }),
      ];

    case 'paragraph':
      return [new Paragraph({ children: inlineToRuns(token.tokens) })];

    case 'list': {
      const out = [];
      const indent = 360 * (depth + 1);
      for (const item of token.items) {
        const bullet = token.ordered ? `${(item.task ? '☐ ' : '')}` : '• ';
        const runs = listItemRuns(item);
        out.push(
          new Paragraph({
            children: [new TextRun({ text: bullet }), ...runs],
            indent: { left: indent },
          }),
        );
        // Handle nested blocks inside the item beyond the first text node.
        if (item.tokens) {
          for (let i = 1; i < item.tokens.length; i++) {
            const nested = blockToDocx(item.tokens[i], depth + 1);
            for (const n of nested) out.push(n);
          }
        }
      }
      return out;
    }

    case 'table': {
      const rows = [];
      const headerCells = (token.header || []).map(
        (h) =>
          new TableCell({
            children: [
              new Paragraph({
                children: inlineToRuns(h.tokens).map((r) => {
                  // Force bold on header runs
                  return new TextRun({ ...r.options, bold: true });
                }),
              }),
            ],
            shading: { fill: 'EEEEEE' },
          }),
      );
      rows.push(new TableRow({ children: headerCells }));
      for (const r of token.rows || []) {
        const cells = r.map(
          (c) =>
            new TableCell({
              children: [new Paragraph({ children: inlineToRuns(c.tokens) })],
            }),
        );
        rows.push(new TableRow({ children: cells }));
      }
      return [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows,
        }),
      ];
    }

    case 'code': {
      const lines = (token.text || '').split('\n');
      return lines.map(
        (line) =>
          new Paragraph({
            children: [new TextRun({ text: line || ' ', font: MONO_FONT, size: 20 })],
            shading: { fill: 'F5F5F5' },
          }),
      );
    }

    case 'blockquote': {
      const out = [];
      for (const sub of token.tokens || []) {
        const blocks = blockToDocx(sub, depth);
        for (const b of blocks) {
          if (b instanceof Paragraph) {
            // Wrap blockquote paragraphs with indent + light grey
            out.push(
              new Paragraph({
                children: [new TextRun({ text: '› ', color: '888888' })].concat(
                  // Recreate runs with italic, since we cannot mutate existing children easily.
                  // For simplicity, fall back to plain text if we cannot reach inner runs.
                  []
                ),
                indent: { left: 240 },
              }),
            );
            // Push the original block too (not italicised — keeps content faithful)
            out.push(b);
          } else {
            out.push(b);
          }
        }
      }
      // De-duplicate the marker-only paragraphs by collapsing consecutive ones.
      return out;
    }

    case 'hr':
      return [
        new Paragraph({
          children: [new TextRun({ text: '─'.repeat(40), color: '999999' })],
          alignment: AlignmentType.CENTER,
        }),
      ];

    case 'space':
      return [];

    case 'html': {
      const text = (token.text || '').trim();
      if (!text) return [];
      // Skip pure HTML tags but keep inner text if any.
      const stripped = text.replace(/<[^>]+>/g, '').trim();
      if (!stripped) return [];
      return [
        new Paragraph({
          children: [new TextRun({ text: stripped, italics: true, color: '666666' })],
        }),
      ];
    }

    default:
      if (token.text) {
        return [new Paragraph({ children: [new TextRun({ text: token.text })] })];
      }
      return [];
  }
}

async function convertFile(mdPath, docxPath) {
  const md = await fs.readFile(mdPath, 'utf-8');
  const tokens = marked.lexer(md);
  const blocks = tokens.flatMap((t) => blockToDocx(t));
  const doc = new Document({
    creator: 'iFare docs converter',
    title: path.basename(mdPath, '.md'),
    styles: {
      default: {
        document: {
          run: { font: ZH_FONT, size: 22 },
        },
      },
    },
    sections: [{ children: blocks }],
  });
  const buf = await Packer.toBuffer(doc);
  await fs.writeFile(docxPath, buf);
  return buf.length;
}

async function main() {
  const files = await fs.readdir(DOCS_DIR);
  const mds = files.filter((f) => f.startsWith('iFare_') && f.endsWith('.md')).sort();
  if (mds.length === 0) {
    console.log('No iFare_*.md files found in', DOCS_DIR);
    return;
  }
  console.log(`Converting ${mds.length} markdown files in ${DOCS_DIR}`);
  console.log('---');
  let totalOut = 0;
  for (const md of mds) {
    const mdPath = path.join(DOCS_DIR, md);
    const docxName = md.replace(/\.md$/, '.docx');
    const docxPath = path.join(DOCS_DIR, docxName);
    try {
      const size = await convertFile(mdPath, docxPath);
      totalOut += size;
      const kb = (size / 1024).toFixed(1);
      console.log(`✓ ${md.padEnd(45)} → ${docxName} (${kb} KB)`);
    } catch (err) {
      console.error(`✗ ${md} failed:`, err.message);
      console.error(err.stack);
    }
  }
  console.log('---');
  console.log(`Done. Total output: ${(totalOut / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
