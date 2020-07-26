import AWS from 'aws-sdk';
import envConfig from '../env.json';

const DDBGeo = require('dynamodb-geo');

const GEO_HASH_LENGTH = 4;

class DDBClient {
  client: AWS.DynamoDB;
  tableName: string;
  geoTableManager: any; // TODO: Missing type declarations

  constructor(tableName?: string) {
    if (!tableName) throw new Error('No tableName specified');

    this.client = new AWS.DynamoDB({
      apiVersion: '2012-08-10',
      region: process.env.AWS_REGION,
    });

    const ddbGeoConfig = new DDBGeo.GeoDataManagerConfiguration(
      this.client,
      tableName
    );

    const {
      hashKeyAttributeName,
      rangeKeyAttributeName,
      geohashAttributeName,
      geohashIndexName,
    } = envConfig.ddb;

    Object.assign(ddbGeoConfig, {
      hashKeyLength: GEO_HASH_LENGTH,
      hashKeyAttributeName,
      rangeKeyAttributeName,
      geohashAttributeName,
      geohashIndexName,
    });

    this.geoTableManager = new DDBGeo.GeoDataManager(ddbGeoConfig);
    this.tableName = tableName;
  }

  getItem(keyObj: { [key: string]: any }) {
    const marshalledKey = AWS.DynamoDB.Converter.marshall(keyObj);

    return this.client
      .getItem({
        TableName: this.tableName,
        Key: marshalledKey,
      })
      .promise();
  }

  createItem(Item: AWS.DynamoDB.PutItemInputAttributeMap) {
    return this.client
      .putItem({
        TableName: this.tableName,
        Item,
      })
      .promise();
  }

  batchPut(items: AWS.DynamoDB.PutItemInputAttributeMap[]) {
    const request = {
      RequestItems: {
        [this.tableName]: items.map((item) => ({
          PutRequest: {
            Item: item,
          },
        })),
      },
    };
    return this.client.batchWriteItem(request).promise();
  }

  getPoints(latitude: number, longitude: number, radius: number) {
    return this.geoTableManager.queryRadius({
      RadiusInMeter: radius,
      CenterPoint: {
        latitude,
        longitude,
      },
    });
  }

  // TODO: Support more than one condition expression
  async query(field: string, value: any, IndexName: AWS.DynamoDB.IndexName) {
    const marshalledValue = AWS.DynamoDB.Converter.input(value);

    const params = {
      ExpressionAttributeValues: {
        ':attr': marshalledValue,
      },
      KeyConditionExpression: `${field} = :attr`,
      TableName: this.tableName,
      IndexName,
    };

    const response = await this.client.query(params).promise();
    return response.Items;
  }

  async scanTable(
    FilterExpression: AWS.DynamoDB.ConditionExpression,
    ExpressionAttributeValues: AWS.DynamoDB.ExpressionAttributeValueMap
  ) {
    const response = await this.client
      .scan({
        TableName: this.tableName,
        FilterExpression,
        ExpressionAttributeValues,
      })
      .promise();

    return response.Items;
  }
}

export default DDBClient;