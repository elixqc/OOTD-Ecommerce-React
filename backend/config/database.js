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