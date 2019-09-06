// create instance of the client based on which cloud we are on
const AWS = require('aws-sdk');
var documentClient = new AWS.DynamoDB.DocumentClient();

const tableName = `${process.env.STACK_NAME}-${process.env.TABLE}-${process.env.STACK_ENV}`

if (process.env.REGION) {
  AWS.config.update({
    endpoint: process.env.ENDPOINT,
    region: process.env.REGION
  });
} else {
  AWS.config.update({
    endpoint: process.env.ENDPOINT
  });
}

async function getLookupValue(lookupKey) {
  var params = {
    TableName: tableName,
    Key: {
      Id: lookupKey
    }
  };
  
  try {
    const output = await new Promise((resolve, reject) => {
      documentClient.get(params, function(err, data) {
        if (err) return reject(err);
        if (data['Item']) {
          if (process.env.DEBUG) {
            console.log('Fetched document from DB');
          }
          resolve(data['Item']);
        } else {
          if (process.env.DEBUG) {
            console.log('Document not found in DB');
          }
          resolve(undefined);
        }
      });
    });

    return output;
  } catch(err) {
    console.log(err);
  }
}

module.exports.getLookupValue = getLookupValue;
