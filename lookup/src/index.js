const simplejson = require('@project-furnace/simplejsonutils');

const logic = require('./logic');

const lookupMap = new Map();

const lookupField = process.env.LOOKUP_FIELD;
const outputLookupField = process.env.OUTPUT_LOOKUP_FIELD;

async function handler(event, context = null) {
  // check if the event has value defined for what needs to be looked up for
  const valueToLookup = simplejson.getPath(event, lookupField);

  if (valueToLookup) {
    // if it does, try and figure out if we already have it in the cache
    const lookupValue = lookupMap.get(valueToLookup);
    if (lookupValue) {
      simplejson.setPath(event, outputLookupField, lookupValue);
    } else {
      // check value in the relevant table
    }
  }
  
  return event;
}

module.exports.handler = handler;
