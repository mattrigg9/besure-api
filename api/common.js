import config from '../config';

export class ClientError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ClientError';
  }
}

const responseHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*' // TODO: Migrate to config
}

export const responsePayload = (statusCode, body) => ({
  headers: responseHeaders,
  statusCode,
  body: JSON.stringify(body)
});
