const AWS = require('aws-sdk');

const documentClient = new AWS.DynamoDB.DocumentClient();

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

// we want to overwrite this to be able to do batch processing
async function unpackAndProcess(events) {
  const outputEvents = [];
  outputEvents[0] = [];

  let currentBatchSize = 0;
  let batchNum = 0;

  // create array with the events we want to send to DynamoDB
  events.forEach((elem) => {
    if (elem.kinesis && elem.kinesis.data) {
      if (currentBatchSize >= process.env.BATCH) {
        batchNum += 1;
        currentBatchSize = 0;
        outputEvents[batchNum] = [];
      }

      const item = { PutRequest: { Item: JSON.parse(Buffer.from(elem.kinesis.data, 'base64')) } };

      outputEvents[batchNum].push(item);
      // keep track of the batch size and increment the batch num if we have already enough
      // events in that batch
      currentBatchSize += 1;
    }
  });
  // if we have events on our array, send them to DynamoDB
  if (outputEvents.length > 0) {
    const promises = [];
    
    for (let ii = 0; ii < outputEvents.length; ii += 1) {
      const params = { RequestItems: {} };
      params.RequestItems[process.env.TABLE] = outputEvents[ii]

      promises.push(documentClient.batchWrite(params).promise());
    }
    const results = await Promise.all(promises);

    if (process.env.DEBUG) {
      // eslint-disable-next-line no-console
      console.log(results);
    }
  }
  // return empty so we send nothing to an output queue - this is just a sink
  return [];
}

module.exports.unpackAndProcess = unpackAndProcess;
