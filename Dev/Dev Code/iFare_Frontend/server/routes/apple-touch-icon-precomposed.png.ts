export default defineEventHandler((event) => {
  setResponseStatus(event, 204, 'No Content');
  setHeader(event, 'Cache-Control', 'public, max-age=86400');
  return '';
});
