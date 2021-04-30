import AWS from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ClientError, responsePayload } from './common';
import DDBClient from './ddbClient';
import Clinic from './models/Clinic';

const MAX_RADIUS_METERS = 100000; // ~62mi
const MAX_RESULTS = 50;

type ClinicWithDistance = Clinic & { distance: number };

export const list = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    try {
        if (!event.queryStringParameters)
            throw new ClientError('No parameters specified');

        // Parse parameters into numbers
        const [latitude, longitude, radius] = [
            event.queryStringParameters.latitude,
            event.queryStringParameters.longitude,
            event.queryStringParameters.radius,
        ].map((val) => (val ? Number.parseFloat(val) : null));

        /**
         * Validation moved inline because TS cannot infer type-based throws outside of block
         */
        if (!radius || radius >= MAX_RADIUS_METERS) {
            throw new ClientError(`Invalid radius: ${radius}`);
        }

        if (!latitude || latitude < -90 || latitude > 90) {
            throw new ClientError(`Invalid latitude: ${latitude}`);
        }

        if (!longitude || longitude < -180 || longitude > 180) {
            throw new ClientError(`Invalid longitude: ${longitude}`);
        }

        const ddbClient = new DDBClient(process.env.CLINIC_TABLE_NAME);
        const results = await ddbClient.getPoints(latitude, longitude, radius);
        console.log('Result count: ', results.length);

        const resultsWithDistance: ClinicWithDistance[] = results.map(
            (result: AWS.DynamoDB.AttributeMap) => {
                // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/Converter.html
                const unmarshalledResult = AWS.DynamoDB.Converter.unmarshall(
                    result
                );
                const clinic = new Clinic(unmarshalledResult);
                return {
                    ...clinic,
                    distance: clinic.getDistance(latitude, longitude),
                };
            }
        );

        // Sort results by distance from origin request
        resultsWithDistance.sort((a, b) => a.distance - b.distance);

        return responsePayload(200, {
            clinics: resultsWithDistance.slice(0, MAX_RESULTS),
        });
    } catch (error) {
        console.error(error);

        if (error instanceof ClientError) {
            return responsePayload(400, { error: 'Bad Request' });
        }
        return responsePayload(500, { error: 'Something went wrong' });
    }
};
