export class ClientError extends Error {
    constructor(message) {
      super(message);
      this.name = "ClientError";
    }
  }

export const responsePayload = (statusCode, body) => {
    return {
        headers: { 'Content-Type': 'application/json' },
        statusCode,
        body: JSON.stringify(body)
    };
}