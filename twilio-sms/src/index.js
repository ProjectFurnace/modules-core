const logic = require('./logic');

async function handler(event, context = null) {
  await logic.sendSms(event, context);
  
  return null;
}

module.exports.handler = handler;
