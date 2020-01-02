import AWS from 'aws-sdk';
import DDBClient from '../DDBClient';
const MAX_RADIUS_METERS = 100000; // ~62mi

module.exports.list = async (event, context, callback) => {
    try {
        console.log('event', event);
        const ddbClient = new DDBClient(process.env.CLINIC_TABLE_NAME);
        const { latitude, longitude, radius } = event.queryStringParameters;
        
        if (Number.parseFloat(radius) >= MAX_RADIUS_METERS) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: "Bad Request" })
            };
        }

        const results = await ddbClient.getPoints(Number.parseFloat(latitude), Number.parseFloat(longitude), Number.parseFloat(radius));
        console.log("Results: ", results.length);

        // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/Converter.html
        const unmarshalledResults = results.map(AWS.DynamoDB.Converter.unmarshall)

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clinics: unmarshalledResults }),
        };
    } catch (error) {
        console.error(error);
        throw new Error("Something went wrong");
    }
};