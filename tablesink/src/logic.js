const tableName = `${process.env.STACK_NAME}-${process.env.TABLE}-${process.env.STACK_ENV}`

// create instance of the client based on which cloud we are on
if (process.env.AWS_REGION) {
  const AWS = require('aws-sdk');
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
  /*const {BigQuery} = require('@google-cloud/bigquery');
  const bigquery = new BigQuery();
  const dataset = bigquery.dataset(`${process.env.STACK_NAME}_${process.env.TABLE}_dataset_${process.env.STACK_ENV}`);
  var table = dataset.table(tableName.replace(/-/g, '_'));*/
  const Firestore = require('@google-cloud/firestore');
  var firestore = new Firestore({
    projectId: process.env.GCP_PROJECT,
    timestampsInSnapshots: true,
});
} else {
  var azureStorage = require('azure-storage');
  const azConnectionString = ( process.env.AZ_CONNECTIONSTRING != '' ? process.env.AZ_CONNECTIONSTRING : process.env.AzureWebJobsStorage );
    
  //var tableService = azureStorage.createTableService(azConnectionString);
  var tableService = azureStorage.createTableService();
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
  /*const descriptor = {
    ...obj,
    PartitionKey: partitionKey,
    RowKey: "",
  };*/

  const descriptor = {
    PartitionKey: partitionKey,
    RowKey: "",
  };

  for (const key in obj) {
    if (key != primaryKey)
      descriptor[key] = translate(key, obj[key]);
  };

  /*for (const key in descriptor) {
    if (descriptor.hasOwnProperty(key)) {
      descriptor[key] = translate(key, descriptor[key]);
    }
  }*/

  return descriptor;
}

async function storeEvent(event, context) {
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
    return firestore.collection(tableName).add(event);
    /*table.insert(event).then(function(data) {
      // All rows inserted successfully
      var apiResponse = data[0]
      return apiResponse;
    }).catch(function(err) {
      if (err.name === 'PartialFailureError') {
        // Insert partially, or entirely failed
      } else {
        // `err` could be a DNS error, a rate limit error, an auth error, etc.
        console.log(err)
        return;
      }
    })*/
    //return table.insert(event);
  // AZURE
  } else {
    const pk = process.env.AZ_PK || 'Id';
    const key = event[pk];
    if (!key) {
        throw new Error(`event must have a value specified for [${pk}]`);
    }
  
    const descriptor = convertToDescriptor(event, pk, key);
  
    return new Promise((resolve, reject) => {
      tableService.insertOrReplaceEntity(tableName.replace(/[^A-Za-z0-9]/g, ""), descriptor, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }
}

module.exports.storeEvent = storeEvent;
