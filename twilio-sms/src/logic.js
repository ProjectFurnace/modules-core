async function sendSms(event, context) {
  const client = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);
    
  try {
    if (event[process.env.TO_FIELD] && event.message) {
      const msg = await client.messages.create({
        from: process.env.NUMBER_FROM,
        body: event.message,
        to: event[process.env.TO_FIELD]
      });

      console.log(msg);
    } else {
      console.log('missing destination number or message')
    }
  } catch (e) {
    throw new Error(e);
  }
}

module.exports.sendSms = sendSms;
