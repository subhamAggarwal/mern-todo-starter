const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

async function connect(uri) {
    if (mongoose.connection.readyState === 1) return mongoose.connection;

    // Prefer an explicit MONGO_URI when given (e.g. a real cluster). Otherwise
    // boot an in-process mongodb-memory-server so the app is self-contained.
    let mongoUri = uri || process.env.MONGO_URI;
    if (!mongoUri) {
        mongod = await MongoMemoryServer.create();
        mongoUri = mongod.getUri();
    }
    await mongoose.connect(mongoUri);
    return mongoose.connection;
}

async function disconnect() {
    await mongoose.disconnect();
    if (mongod) {
        await mongod.stop();
        mongod = null;
    }
}

module.exports = { connect, disconnect };
