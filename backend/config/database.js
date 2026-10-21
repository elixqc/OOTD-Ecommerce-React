// CORE · MongoDB — connects Mongoose to MONGO_URI from config/.env.
// Called once at boot by server.js; every model relies on this connection.
const mongoose = require('mongoose');

const connectDatabase = async () => {
    try {
        const con = await mongoose.connect(process.env.DB_URI);
        console.log(`MongoDB connected: ${con.connection.host}`);
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = connectDatabase;
