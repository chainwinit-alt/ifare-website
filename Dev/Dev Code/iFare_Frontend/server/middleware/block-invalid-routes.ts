const BLOCKED_ROUTE_PATTERNS = [
  /^\/fle\//i,
  /^\/pic\//i,
  /^\/images\/logo\.png$/i,
  /^\/index\/.*\.aspx$/i,
  /\/[^/]*\*[^/]*\/.*\.aspx$/i,
  /\.aspx$/i,
];

export default defineEventHandler((event) => {
  const pathname = getRequestURL(event).pathname;
  const shouldBlock = BLOCKED_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));

  if (!shouldBlock) return;

  setHeader(event, 'Cache-Control', 'no-store');
  setResponseStatus(event, 410, 'Gone');
  return 'Gone';
});
