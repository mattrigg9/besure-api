import AWS from 'aws-sdk';
import { ClientError, responsePayload, cleanClinicResult } from './common';
import env from '../env.json';
import DDBClient from '../DDBClient';

const ID_KEY_NAME = 'id';
const ID_IDEX_NAME = env.ddb.idIndexName;

const validateRequest = ({ clinicId }) => {
  if (!clinicId || Number.isNaN(Number(clinicId))) {
    throw new ClientError(`Invalid clinicId: ${clinicId}`);
  }
};

module.exports.get = async (event) => {
  try {
    validateRequest(event.pathParameters);

    const clinicId = Number(event.pathParameters.clinicId);

    const ddbClient = new DDBClient(process.env.CLINIC_TABLE_NAME);
    const result = await ddbClient.query(ID_KEY_NAME, clinicId, ID_IDEX_NAME);

    console.log('Result from table: ', result);

    if (!result.length) throw new Error(`Clinic with ID ${clinicId} could not be found.`);

    const unmarshalledResult = AWS.DynamoDB.Converter.unmarshall(result[0]);
    const cleanedClinic = cleanClinicResult(unmarshalledResult);

    return responsePayload(200, { clinic: cleanedClinic });
  } catch (error) {
    console.error(error);

    if (error instanceof ClientError) {
      return responsePayload(400, { error: 'Bad Request' });
    }
    return responsePayload(500, { error: 'Something went wrong' });
  }
};
