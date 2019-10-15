const AWS = require('aws-sdk');

const s3 = new AWS.S3();

async function handler(event) {
  if(event.eventSource !== 'aws:s3') {
    throw new Error('This tap only supports S3 events');
  }

  let returnEvent = {};

  if(event.eventName.includes('ObjectCreated:')) {
    const params = {Bucket: event.s3.bucket.name, Key: event.s3.object.key};
    const fileContents = await s3.getObject(params).promise();

    returnEvent['key'] = event.s3.object.key;
    returnEvent['bucket'] = event.s3.bucket.name;
    returnEvent['time'] = event.eventTime;
    returnEvent['size'] = event.s3.object.size;

    if(process.env.DEBUG) {
      console.log(returnEvent);
    }
    /* TODO: this is not by any means the way to handle file
       types but it is a start */
    if(event.s3.object.key.endsWith('.json')) {
      returnEvent['contentType'] = 'text/json';
      returnEvent['content'] = JSON.parse(fileContents);
    } else {
      returnEvent['contentType'] = 'application/octet-stream';
      returnEvent['content'] = fileContents.Body.toString('base64');
    }

    return returnEvent;
  }
}

module.exports.handler = handler;
