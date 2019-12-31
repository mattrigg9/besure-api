//const fetchClinics = require('./fetchClinics.js');
import config from './config';
import { chunk, backoff } from './utils';
import DDBClient from './DDBClient';

const MAX_ITEMS_PER_DDB_REQUEST = 25;

module.exports.update = async (event, context, callback) => {
    //console.log(`Event: \n${JSON.stringify(event, null, 2)}`);

    //const clinics = await fetchClinics();
    const ddbClient = new DDBClient(config.clinicTableName);
    const chunkedRequests = chunk(event, MAX_ITEMS_PER_DDB_REQUEST);
    console.log("Chunked requests: ", chunkedRequests.length);
    const requestPromises = chunkedRequests.map(items => backoff(() => ddbClient.batchPut(items)));
    const result = await Promise.allSettled(requestPromises);
    console.log("All batches complete", result);
};