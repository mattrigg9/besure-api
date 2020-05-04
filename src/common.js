import config from '../config';

const whitelistedClinicFields = [
    'id',
    'name',
    'address',
    'website',
    'latitude',
    'longitude',
    'phone',
    'tests',
    'vaccines',
    'fees'
];

// Credit: https://stackoverflow.com/questions/25553910/one-liner-to-take-some-properties-from-object-in-es-6/25835337
function pick(o, fields) {
  return fields.reduce((a, x) => {
      // eslint-disable-next-line no-prototype-builtins
      if(o.hasOwnProperty(x)) a[x] = o[x];
      return a;
  }, {});
}

export const cleanClinicResult = (clinic) => pick(clinic, whitelistedClinicFields);

export class ClientError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ClientError';
  }
}

const responseHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': config.CORS_DOMAIN
}

export const responsePayload = (statusCode, body) => ({
  headers: responseHeaders,
  statusCode,
  body: JSON.stringify(body)
});
