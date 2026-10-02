const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ success: true, message: 'OOTD API is running' });
});

module.exports = app;