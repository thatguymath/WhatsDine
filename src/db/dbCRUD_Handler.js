const Datastore = require('@seald-io/nedb')

// Initialize the databases
const databases = {
  orders: new Datastore({ filename: './src/db/storage/orders.db', autoload: true })
};

// database.js
async function createRecord(databaseName, record) {
  try {
    const database = databases[databaseName];
    if (!database) throw new Error(`Database '${databaseName}' not found.`);

    await database.insertAsync(record)
  } catch (err) {
    console.error(err);
  }
}

async function readRecord(databaseName, queryObject) {
  try {
    const database = databases[databaseName];
    if (!database) throw new Error(`Database '${databaseName}' not found.`);

    const docs = await database.findAsync(queryObject)
    return docs

  } catch (err) {
    console.error(err);
  }
}

async function readOneRecord(databaseName, queryObject) {
  try {
    const database = databases[databaseName];
    if (!database) throw new Error(`Database '${databaseName}' not found.`);

    const docs = await database.findOneAsync(queryObject)
    return docs

  } catch (err) {
    console.error(err);
  }
}

async function updateRecord(databaseName, queryObject, updateObject, optionsObject) {
  try {
    const database = databases[databaseName];
    if (!database) throw new Error(`Database '${databaseName}' not found.`);

    const docs = await database.updateAsync(queryObject, updateObject, optionsObject)
    return docs

  } catch (err) {
    console.error(err);
  }
}

async function deleteRecord() {
  // todo
}

module.exports = {
  createRecord,
  readRecord,
  readOneRecord,
  updateRecord,
  deleteRecord,
};
