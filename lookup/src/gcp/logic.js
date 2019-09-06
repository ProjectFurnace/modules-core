// create instance of the client based on which cloud we are on
const Firestore = require('@google-cloud/firestore');
var firestore = new Firestore({
  projectId: process.env.GCP_PROJECT
});

const tableName = `${process.env.STACK_NAME}-${process.env.TABLE}-${process.env.STACK_ENV}`

async function getLookupValue(lookupKey) {
  try {
    console.log(`Retrieving document ID: ${lookupKey}`);
    return await firestore.collection(tableName).doc(lookupKey).get();
  } catch(err) {
    console.log(err);
  }
}

module.exports.getLookupValue = getLookupValue;
