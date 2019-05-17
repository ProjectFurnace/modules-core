const AWS = require('aws-sdk');
const azureStorage = require('azure-storage');
const BigQuery = require('@google-cloud/bigquery');

const tableName = `${process.env.STACK_NAME}-${process.env.TABLE}-${process.env.STACK_ENV}`

// create instance of the client based on which cloud we are on
if (process.env.AWS_REGION) {
  var documentClient = new AWS.DynamoDB.DocumentClient();

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
} else if (process.env.GCP_PROJECT) {
  const bigquery = new BigQuery();
  const dataset = bigquery.dataset(`${process.env.STACK_NAME}-${process.env.TABLE}_dataset-${process.env.STACK_ENV}`);
  var table = dataset.table(tableName);
} else {
  const azConnectionString = ( process.env.AZ_CONNECTIONSTRING != '' ? process.env.AZ_CONNECTIONSTRING : process.env.AzureWebJobsStorage );
    
  var tableService = azureStorage.createTableService(azConnectionString);
}

function translate(key, value) {
  const entGen = azureStorage.TableUtilities.entityGenerator;
  if (Buffer.isBuffer(value)) {
      return entGen.Binary(value);
  }

  if (value instanceof Date) {
      return entGen.DateTime(value);
  }

  switch (typeof value) {
      case "string": return entGen.String(value);
      case "number": return entGen.Double(value);
      case "boolean": return entGen.Boolean(value);
      default:
          throw new Error(`value[${key}] was not a supported type.  Supported types are: string | number | boolean | Date | Buffer`);
  }
}

function convertToDescriptor(obj, primaryKey, partitionKey) {
  // Copy all properties the user provides over.  Then supply the appropriate partition
  // and row.  Do not copy over the primary key the user supplies. It will be place in
  // RowKey instead.
  const descriptor = {
    ...obj,
    PartitionKey: partitionKey,
    RowKey: "",
  };

  for (const key in descriptor) {
    if (descriptor.hasOwnProperty(key)) {
      descriptor[key] = translate(key, descriptor[key], azureStorage);
    }
  }

  return descriptor;
}

function storeEvent(event) {
  // AWS
  if (process.env.AWS_REGION) {
    var params = {
      TableName: tableName,
      Item: event
    };
    
    return new Promise((resolve, reject) => {
      documentClient.put(params, function(err, data) {
        if (err) return reject(err);
        resolve(data);
      });
    });
  // GCP
  } else if (process.env.GCP_PROJECT) {    
    return table.insert(event);
  // AZURE
  } else {
    const key = event[process.env.AZ_PK];
    if (!key) {
        throw new Error(`event must have a value specified for [${process.env.AZ_PK}]`);
    }
  
    const descriptor = convertToDescriptor(event, process.env.AZ_PK, key);
  
    return new Promise((resolve, reject) => {
      tableService.insertOrReplaceEntity(tableName.replace(/[^A-Za-z0-9]/g, ""), descriptor, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }
}

module.exports.storeEvent = storeEvent;
