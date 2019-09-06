// create instance of the client based on which cloud we are on
var azureStorage = require('azure-storage');

const tableName = `${process.env.STACK_NAME}-${process.env.TABLE}-${process.env.STACK_ENV}`

var tableService = azureStorage.createTableService();

async function getLookupValue(lookupKey) {
  const pk = process.env.AZ_PK || 'Id';
  const key = event[pk];
  if (!key) {
      throw new Error(`event must have a value specified for [${pk}]`);
  }

  try {
    const output = await new Promise((resolve, reject) => {
      tableService.queryEntities(tableName, new TableQuery().where(pk + '== ?', lookupKey), null, descriptor, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    return output;
  } catch(err) {
    context.log(err);
  }
}

module.exports.getLookupValue = getLookupValue;
