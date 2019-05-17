const logic = require('./logic');

async function handler(event) {
  const processed = await logic.storeEvent(event);

  return processed;
}

module.exports.handler = handler;
