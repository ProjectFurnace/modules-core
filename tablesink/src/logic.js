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
  const Firestore = require('@google-cloud/firestore');
  var firestore = new Firestore({
    projectId: process.env.GCP_PROJECT
});
} else {
  var azureStorage = require('azure-storage');

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
      throw new Error(`value[${key}] with type ${(typeof value)}is not supported.  Supported types are: string | number | boolean | Date | Buffer`);
  }
}

function convertToDescriptor(obj, primaryKey, partitionKey, context) {
  const descriptor = {
    PartitionKey: partitionKey,
    RowKey: '',
  };

  for (const key in obj) {
    // avoid inserting nulls but report them
    if (obj[key] != null) {
      if (key != primaryKey)
        descriptor[key] = translate(key, obj[key]);
    } else {
      context.log(`Warning: avoiding conversion of null value in field ${key}`);
    }
  };

  return descriptor;
}

async function storeEvent(event, context) {
  // AWS
  if (process.env.AWS_REGION) {
    var params = {
      TableName: tableName,
      Item: event
    };
    
    try {
      const output = await new Promise((resolve, reject) => {
        documentClient.put(params, function(err, data) {
          if (err) return reject(err);
          resolve(data);
        });
      });

      console.log('Document added to DB');
    } catch(err) {
      console.log(err);
    }
  // GCP
  } else if (process.env.GCP_PROJECT) {
    try {
      const documentReference = await firestore.collection(tableName).add(event);
      console.log(`Added document with ID: ${documentReference.id}`);
    } catch(err) {
      console.log(err);
    }
  // AZURE
  } else {
    const pk = process.env.AZ_PK || 'Id';
    const key = event[pk];
    if (!key) {
        throw new Error(`event must have a value specified for [${pk}]`);
    }
  
    const descriptor = convertToDescriptor(event, pk, key, context);
  
    try {
      const output = await new Promise((resolve, reject) => {
        tableService.insertOrReplaceEntity(tableName.replace(/[^A-Za-z0-9]/g, ""), descriptor, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
      context.log('Added entity', output);
    } catch(err) {
      context.log(err);
    }
  }
}

module.exports.storeEvent = storeEvent;
