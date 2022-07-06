import { appendFile } from 'node:fs/promises';

export default async function log(message) {
  let filehandle;
  try {
    filehandle = await appendFile('log/debug.txt', message);
  } finally {
    await filehandle?.close();
  }
}