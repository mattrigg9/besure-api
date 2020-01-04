// const fetchClinics = require('./fetchClinics.js');
import AWS from 'aws-sdk';
import { pause } from '../utils';
import DDBClient from '../DDBClient';

const BATCH_SIZE = 25;
const WAIT_BETWEEN_BATCHES_MS = 1000;

module.exports.updateTable = async (data) => {
  const ddbClient = new DDBClient(process.env.CLINIC_TABLE_NAME);

  // Map incoming clinics into DDB put requests
  const pointInputs = data.map((clinic) => {
    // Use AWS.DynamoDB.Converter to marshall row data into DDB syntax
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/Converter.html
    if (clinic.website === '') {
      clinic.website = null;
    }

    return {
      RangeKeyValue: AWS.DynamoDB.Converter.input(clinic.id),
      GeoPoint: {
        latitude: clinic.latitude,
        longitude: clinic.longitude
      },
      PutItemInput: {
        Item: AWS.DynamoDB.Converter.marshall(clinic)
      }
    };
  });

  let currentBatch = 1;
  const resumeWriting = async () => {
    if (pointInputs.length === 0) return Promise.resolve();
    const thisBatch = [];
    for (let i = 0, itemToAdd = null; i < BATCH_SIZE && (itemToAdd = pointInputs.shift()); i++) {
      thisBatch.push(itemToAdd);
    }
    console.log(`Writing batch ${currentBatch++}/${Math.ceil(data.length / BATCH_SIZE)}`);

    await ddbClient.batchWritePoints(thisBatch);
    await pause(WAIT_BETWEEN_BATCHES_MS);
    return resumeWriting();
  };

  await resumeWriting();

  console.log('All batches complete');
};
