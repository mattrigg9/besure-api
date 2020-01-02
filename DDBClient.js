import AWS from 'aws-sdk';
import config from './config';

const DDBGeo = require('dynamodb-geo');

const GEO_HASH_LENGTH = 4;

class DDBClient {
  constructor(tableName) {
    this.client = new AWS.DynamoDB({
      apiVersion: '2012-08-10',
      region: process.env.AWS_REGION
    });

    const ddbGeoConfig = new DDBGeo.GeoDataManagerConfiguration(this.client, tableName);

    const {
      hashKeyAttributeName,
      rangeKeyAttributeName,
      geohashAttributeName,
      geohashIndexName
    } = config.ddb;

    Object.assign(ddbGeoConfig, {
      hashKeyLength: GEO_HASH_LENGTH,
      hashKeyAttributeName,
      rangeKeyAttributeName,
      geohashAttributeName,
      geohashIndexName
    });

    this.geoTableManager = new DDBGeo.GeoDataManager(ddbGeoConfig);
    this.tableName = tableName;
  }

  createItem(Item) {
    return this.client
      .put({
        TableName: this.tableName,
        Item
      })
      .promise();
  }

  deleteItem(keyName, key) {
    return this.client
      .delete({
        TableName: this.tableName,
        Key: {
          [keyName]: key
        }
      })
      .promise();
  }

  batchPut(items) {
    const request = {
      RequestItems: {
        [this.tableName]: items.map((item) => {
          return {
            PutRequest: {
              Item: item
            }
          }
        })
      }
    }
    return this.client.batchWrite(request).promise();
  }

  batchWritePoints(points) {
    return this.geoTableManager.batchWritePoints(points).promise();
  }

  getPoints(latitude, longitude, radius) {
    return this.geoTableManager.queryRadius({
      RadiusInMeter: radius,
      CenterPoint: {
        latitude,
        longitude
      }
    });
  }

  async scanTable(FilterExpression, ExpressionAttributeValues) {
    const response = await this.client
      .scan({
        TableName: this.tableName,
        FilterExpression,
        ExpressionAttributeValues
      })
      .promise();

    return response.Items;
  }
}

module.exports = DDBClient;
