import config from '../config';

export class ClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClientError';
  }
}

const responseHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': config.CORS_DOMAIN,
};

export const responsePayload = (statusCode: number, body: any) => ({
  headers: responseHeaders,
  statusCode,
  body: JSON.stringify(body),
});
