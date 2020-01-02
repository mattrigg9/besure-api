import AWS from 'aws-sdk';
import DDBClient from '../DDBClient';

module.exports.list = async (event, context, callback) => {
    try {
        console.log('event', event);
        const ddbClient = new DDBClient(process.env.CLINIC_TABLE_NAME);
        const { latitude, longitude, radius } = event.queryStringParameters;
        const results = await ddbClient.getPoints(latitude, longitude, radius);
        
        // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/Converter.html
        const unmarshalledResults = AWS.DynamoDB.Converter.unmarshall(results);

        console.log("Results: ", results.length);
        const response = {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(unmarshalledResults),
        };
        callback(null, response);
    } catch (error) {
        console.error(error);
        callback(null, {
            statusCode: error.statusCode || 500,
            headers: { 'Content-Type': 'application/json' },
            body: { error: "Something went wrong" }
        });
        return;
    }
};