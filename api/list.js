import AWS from 'aws-sdk';
import { ClientError, responsePayload } from './common';
import { getDistance } from './utils';
import DDBClient from '../DDBClient';

const MAX_RADIUS_METERS = 100000; // ~62mi
const MAX_RESULTS = 50;

const validateRequest = (latitude, longitude, radius) => {
  if (!radius || radius >= MAX_RADIUS_METERS) {
    throw new ClientError(`Invalid radius: ${radius}`);
  }

  if (!latitude || latitude < -90 || latitude > 90) {
    throw new ClientError(`Invalid latitude: ${latitude}`);
  }

  if (!longitude || longitude < -180 || longitude > 180) {
    throw new ClientError(`Invalid longitude: ${longitude}`);
  }
};

module.exports.list = async (event) => {
  try {
    const latitude = Number.parseFloat(event.queryStringParameters.latitude);
    const longitude = Number.parseFloat(event.queryStringParameters.longitude);
    const radius = Number.parseFloat(event.queryStringParameters.radius);

    validateRequest(latitude, longitude, radius);

    const distanceFromOrigin = (result) => getDistance(latitude, longitude, result.latitude, result.longitude);

    const ddbClient = new DDBClient(process.env.CLINIC_TABLE_NAME);
    const results = await ddbClient.getPoints(latitude, longitude, radius);
    console.log('Results: ', results.length);

    const resultsWithDistance = results.map(result => {
      // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/Converter.html
      const unmarshalledResult = AWS.DynamoDB.Converter.unmarshall(result);
      return {
        ...unmarshalledResult,
        distance: distanceFromOrigin(unmarshalledResult)
      }
    });

    // Sort results by distance from origin request
    resultsWithDistance.sort((a, b) => a.distance - b.distance);

    return responsePayload(200, { clinics: resultsWithDistance.slice(0, MAX_RESULTS) });
  } catch (error) {
    console.error(error);

    if (error instanceof ClientError) {
      return responsePayload(400, { error: 'Bad Request' });
    }
    return responsePayload(500, { error: 'Something went wrong' });
  }
};
