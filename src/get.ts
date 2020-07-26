import AWS from 'aws-sdk';
import { 
  APIGatewayProxyEvent, 
  APIGatewayProxyResult 
} from "aws-lambda";
import { ClientError, responsePayload } from './common';
import env from '../env.json';
import DDBClient from './ddbClient';
import Clinic from './models/Clinic';
import { Dictionary } from './types';

const ID_KEY_NAME = 'id';
const ID_IDEX_NAME = env.ddb.idIndexName;

const validateRequest = (pathParameters: Dictionary<string> | null) => {
  if (!pathParameters) throw new ClientError('No parameters specified');
  const { clinicId } =  pathParameters;
  if (!clinicId || Number.isNaN(Number(clinicId))) {
    throw new ClientError(`Invalid clinicId: ${clinicId}`);
  }
};

export const get = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    validateRequest(event.pathParameters);

    const clinicId = Number(event.pathParameters?.clinicId);

    const ddbClient = new DDBClient(process.env.CLINIC_TABLE_NAME);
    const result = await ddbClient.query(ID_KEY_NAME, clinicId, ID_IDEX_NAME);

    console.log('Result from table: ', result);

    if (!result?.length) throw new Error(`Clinic with ID ${clinicId} could not be found.`);

    const unmarshalledResult = AWS.DynamoDB.Converter.unmarshall(result[0]);
    const clinic = new Clinic(unmarshalledResult);

    return responsePayload(200, { clinic });
  } catch (error) {
    console.error(error);

    if (error instanceof ClientError) {
      return responsePayload(400, { error: 'Bad Request' });
    }
    return responsePayload(500, { error: 'Something went wrong' });
  }
};
