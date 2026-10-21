// CORE · App entry — loads config/.env, connects MongoDB, starts the Express server.
// Run with npm start; imports the app from app.js and listens on process.env.PORT.
const dotenv = require('dotenv');
dotenv.config({ path: './config/.env' });

const app = require('./app');
const connectDatabase = require('./config/database');

connectDatabase();

app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT} in ${process.env.NODE_ENV} mode`);
});
