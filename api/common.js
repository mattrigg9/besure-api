export class ClientError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ClientError';
  }
}

const responseHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'http://localhost:8080'
}

export const responsePayload = (statusCode, body) => ({
  headers: responseHeaders,
  statusCode,
  body: JSON.stringify(body)
});
