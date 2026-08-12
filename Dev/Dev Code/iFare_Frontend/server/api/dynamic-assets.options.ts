import { applyCors } from '~/server/utils/cors';

export default defineEventHandler((event) => {
  applyCors(event);
  setResponseStatus(event, 204);
  return '';
});
