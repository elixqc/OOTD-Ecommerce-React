const dotenv = require('dotenv');
dotenv.config({ path: './config/.env' });

const app = require('./app');
const connectDatabase = require('./config/database');

connectDatabase();

app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT} in ${process.env.NODE_ENV} mode`);
});