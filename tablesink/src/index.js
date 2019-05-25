const logic = require('./logic');

async function handler(event, context = null) {
  await logic.storeEvent(event, context);
  
  return null;
}

module.exports.handler = handler;
