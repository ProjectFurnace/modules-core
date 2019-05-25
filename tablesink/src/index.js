const logic = require('./logic');

async function handler(event, context = null) {
  try {
    const processed = await logic.storeEvent(event, context);
    
    return processed;
  } catch(e) {
    if (context)
      context.log(e);
    else {
      if (e.name === 'PartialFailureError') {
        console.log(e.errors[0].errors);
      }
    }
  }
}

module.exports.handler = handler;
