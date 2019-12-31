import AWS from 'aws-sdk';
import config from './config';

class DDBClient {
  constructor(tableName) {
    // DocumentClient abstracts away the notion of attribute values.
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html
    this.client = new AWS.DynamoDB.DocumentClient({
      apiVersion: '2012-08-10',
      region: config.region
    });
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

  async scanTable() {
    const response = await this.client
      .scan({
        TableName: this.tableName,
      })
      .promise();

    return response.Items;
  }
}

module.exports = DDBClient;
