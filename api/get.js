import AWS from 'aws-sdk';
import { ClientError, responsePayload } from './common';
import DDBClient from '../DDBClient';

const validateRequest = (clinicId) => {
  if (!clinicId || Number.isNaN(clinicId)) {
    throw new ClientError(`Invalid clinicId: ${clinicId}`);
  }
};

module.exports.get = async (event) => {
  try {
    const clinicId = Number(event.queryStringParameters.clinicId);

    validateRequest(clinicId);

    const ddbClient = new DDBClient(process.env.CLINIC_TABLE_NAME);
    const result = await ddbClient.getItem({ id: clinicId });

    console.log('Result: ', result);

    const unmarshalledResult = AWS.DynamoDB.Converter.unmarshall(result);

    return responsePayload(200, { clinic: unmarshalledResult });
  } catch (error) {
    console.error(error);

    if (error instanceof ClientError) {
      return responsePayload(400, { error: 'Bad Request' });
    }
    return responsePayload(500, { error: 'Something went wrong' });
  }
};
