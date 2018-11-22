const zlib = require('zlib');
const path = require('path');
const csvtomap = require('csvtomap');
const logic = require('./logic');

const vpcflMapping = csvtomap.createKeyValue(path.resolve(__dirname, 'data/mapping.csv'), ' => ');

function handler(event) {
  return logic.normalize(event, vpcflMapping);
}

function unpackAndProcess(events) {
  const outputEvents = [];
  events.forEach((elem) => {
    if (elem.kinesis && elem.kinesis.data) {
      const gzippedInput = Buffer.from(elem.kinesis.data, 'base64');

      const gunzippedData = zlib.gunzipSync(gzippedInput);

      const event = JSON.parse(gunzippedData.toString('utf8'));

      // we do not want to send control messages
      if (event.messageType !== 'CONTROL_MESSAGE') {
        outputEvents.push(handler(event));
      }
    }
  });
  return outputEvents;
}

module.exports.handler = handler;
module.exports.unpackAndProcess = unpackAndProcess;
