const assert = require('node:assert/strict');
const { spawn, execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const [variant, nodePath, originMode = 'configured'] = process.argv.slice(2);
assert.ok(['Dev', 'Prd'].includes(variant) && nodePath, 'Usage: node verify-og-output.cjs Dev|Prd <node.exe>');
const source = path.join(root, variant, `${variant} Code`, 'iFare_Frontend');
const { parse } = require(path.join(source, 'node_modules/@vue/compiler-dom'));
const filename = 'og-logo-safe-20260903.png';
const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

function readMetadata(html) {
  const metadata = new Map();
  const visit = (node) => {
    if (node.tag === 'meta' || node.tag === 'link') {
      const attrs = Object.fromEntries(node.props.filter((prop) => prop.type === 6)
        .map((prop) => [prop.name, prop.value?.content]));
      const key = node.tag === 'link' ? (attrs.rel === 'canonical' ? 'canonical' : null) : attrs.property || attrs.name;
      if (key) metadata.set(key, [...(metadata.get(key) || []), node.tag === 'link' ? attrs.href : attrs.content]);
    }
    for (const child of node.children || []) visit(child);
  };
  visit(parse(html));
  return metadata;
}

async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server.address().port;
}

async function main() {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), `ifare-og-${variant.toLowerCase()}-`));
  const output = path.join(temp, '.output');
  await fs.cp(path.join(source, '.output'), output, { recursive: true, dereference: true });
  // Fixture is outside .output and is never included in the deployment copy.
  await fs.mkdir(path.join(temp, 'server/data'), { recursive: true });
  await fs.writeFile(path.join(temp, 'server/data/dynamic-pages.json'), JSON.stringify([{
    id: 'og-fixture', slug: 'og-test-page', title: 'OG dynamic page title',
    metaDescription: 'OG dynamic page description', status: 'published',
    sections: [], parentType: 'none', showOnParent: false,
    createDate: '2026-01-01', updateDate: '2026-01-01',
  }]));
  const apiRequests = [];
  const fixture = http.createServer((req, res) => {
    apiRequests.push(req.url);
    let result = req.url.includes('/GetIFarePolicyDetail')
      ? { id: 5170, title: 'OG fixture policy', qualification: 'Local metadata test only', codeDomicile_LabelName: 'Test' }
      : [];
    if (req.url.includes('/GetNewsDetail')) result = { id: 30, title: 'OG fixture news', content: '<p>News fixture.</p>' };
    if (req.url.includes('/GetArticlesWelfareDetail')) result = { id: 1, title: 'OG fixture welfare', detail: '<p>Welfare fixture.</p>' };
    if (req.url.includes('/GetArticlesLazyDetail')) result = { id: 1, title: 'OG fixture guide', detail: '<p>Guide fixture.</p>' };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ result: { result, errCode: 0, errMsg: 'Success' }, success: true, __abp: true }));
  });
  const apiPort = await listen(fixture);
  const placeholder = http.createServer();
  const port = await listen(placeholder);
  await new Promise((resolve) => placeholder.close(resolve));
  const nodeVersion = execFileSync(nodePath, ['--version'], { encoding: 'utf8', windowsHide: true }).trim();
  const configuredSiteUrl = variant === 'Prd' ? 'https://www.i-fare.org.tw' : 'http://10.200.0.39:3002';
  const siteUrl = originMode === 'request' ? `http://127.0.0.1:${port}` : configuredSiteUrl;
  const env = { ...process.env, NODE_ENV: 'production', PORT: String(port), NITRO_PORT: String(port),
    HOST: '127.0.0.1', NITRO_HOST: '127.0.0.1', NUXT_PUBLIC_SITE_URL: originMode === 'request' ? '' : siteUrl,
    NUXT_FRONTEND_API_SERVER_BASE: `http://127.0.0.1:${apiPort}/api/services/app`,
    NUXT_PUBLIC_FRONTEND_API_BASE: `http://127.0.0.1:${apiPort}/api/services/app` };
  delete env.NODE_PATH;
  const child = spawn(nodePath, [path.join(output, 'server/index.mjs')], {
    cwd: temp, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  child.stdout.on('data', (data) => { logs += data.toString(); });
  child.stderr.on('data', (data) => { logs += data.toString(); });
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { clearInterval(poll); reject(new Error(`Startup timeout: ${logs}`)); }, 30000);
      const poll = setInterval(() => {
        if (logs.includes('Listening on')) { clearInterval(poll); clearTimeout(timeout); resolve(); }
        else if (child.exitCode !== null) { clearInterval(poll); clearTimeout(timeout); reject(new Error(logs)); }
      }, 100);
      child.on('error', (error) => { clearInterval(poll); clearTimeout(timeout); reject(error); });
    });
    const results = [];
    const userAgents = {
      crawler: 'facebookexternalhit/1.1',
      mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
    };
    const routes = ['/', '/about', '/news', '/news/info?id=30', '/articles',
      '/articles/welfare?id=1', '/articles/lazy?id=1', '/collaborator', '/ifare',
      '/ifare/result?query=%E9%95%B7%E7%85%A7&codeDomicileID=17', '/ifare/info?id=5170',
      '/ifare/contact?id=2', '/future', '/preview', '/ifare/compare', '/og-test-page',
      '/news?preview=20260903&utm_source=facebook&fbclid=test#top',
      '/ifare/info?id=5170&preview=20260903&utm_source=facebook'];
    for (const route of routes) {
      for (const [device, userAgent] of Object.entries(userAgents)) {
        const response = await fetch(`http://127.0.0.1:${port}${route}`, {
          headers: { 'User-Agent': userAgent }, signal: AbortSignal.timeout(45000),
        });
        const html = await response.text();
        if (route === '/future') {
          assert.equal(response.status, 404, 'The existing disabled future page must remain disabled');
          results.push({ route, device, status: 404, expected: 'Existing disabled page; not published' });
          continue;
        }
        assert.equal(response.status, 200, `${route}: ${html.slice(0, 500)}`);
        const meta = readMetadata(html);
        for (const key of ['og:title', 'og:description', 'og:type', 'og:site_name', 'og:locale', 'og:url',
          'og:image:alt', 'twitter:title', 'twitter:description', 'canonical']) {
          assert.equal(meta.get(key)?.length, 1, `${route}: missing or duplicate ${key}`);
          assert.ok(meta.get(key)[0].trim(), `${route}: empty ${key}`);
        }
        const expectedUrl = new URL(response.url);
        for (const key of [...expectedUrl.searchParams.keys()]) {
          if (['reload', 'preview', 'fbclid', 'gclid'].includes(key) || key.startsWith('utm_')) expectedUrl.searchParams.delete(key);
        }
        const expectedCanonical = `${siteUrl}${expectedUrl.pathname}${expectedUrl.search}`;
        assert.deepEqual(meta.get('og:url'), [expectedCanonical], `${route}: incorrect share URL`);
        assert.deepEqual(meta.get('canonical'), [expectedCanonical], `${route}: incorrect canonical`);
        const article = ['/news/info', '/articles/welfare', '/articles/lazy', '/ifare/info'].includes(expectedUrl.pathname);
        assert.deepEqual(meta.get('og:type'), [article ? 'article' : 'website']);
        if (expectedUrl.pathname === '/news') assert.ok(meta.get('og:title')[0].includes('最新消息'));
        if (expectedUrl.pathname === '/preview') assert.deepEqual(meta.get('robots'), ['noindex, nofollow']);
        if (expectedUrl.pathname === '/og-test-page') {
          assert.deepEqual(meta.get('og:title'), ['OG dynamic page title']);
          assert.deepEqual(meta.get('og:description'), ['OG dynamic page description']);
        }
        assert.deepEqual(meta.get('og:image'), [`${siteUrl}/${filename}`], `${route}: duplicate or wrong OG image`);
        assert.deepEqual(meta.get('og:image:width'), ['1200']);
        assert.deepEqual(meta.get('og:image:height'), ['630']);
        assert.deepEqual(meta.get('og:image:type'), ['image/png']);
        assert.deepEqual(meta.get('twitter:image'), [`${siteUrl}/${filename}`]);
        if (siteUrl.startsWith('https://')) assert.deepEqual(meta.get('og:image:secure_url'), [`${siteUrl}/${filename}`]);
        else assert.equal(meta.has('og:image:secure_url'), false);
        results.push({ route, device, status: response.status, title: meta.get('og:title')[0],
          description: meta.get('og:description')[0], url: meta.get('og:url')[0], image: meta.get('og:image')[0] });
      }
    }
    const imageResponse = await fetch(`http://127.0.0.1:${port}/${filename}`);
    assert.equal(imageResponse.status, 200);
    assert.ok(imageResponse.headers.get('content-type').startsWith('image/png'));
    const png = Buffer.from(await imageResponse.arrayBuffer());
    assert.equal(sha256(png), sha256(await fs.readFile(path.join(source, 'public', filename))));
    const metadata = await sharp(png).metadata();
    assert.equal(metadata.width, 1200);
    assert.equal(metadata.height, 630);
    const report = { scope: 'all-pages', variant, nodeVersion, nodePath, originMode, isolatedOutput: output, api: 'Local fixture; no production API or database accessed',
      apiRequestCount: apiRequests.length, imageSha256: sha256(png), tests: results, status: 'PASS' };
    await fs.writeFile(path.join(root, 'docs/og-preview', `verification-all-pages-${variant.toLowerCase()}-${nodeVersion}-${originMode}.json`), `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({ variant, nodeVersion, originMode, isolatedOutput: output, cases: results.length,
      apiRequestCount: apiRequests.length, imageSha256: sha256(png), status: 'PASS' }, null, 2));
  } finally {
    if (child.exitCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
    fixture.closeAllConnections();
    await new Promise((resolve) => fixture.close(resolve));
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
