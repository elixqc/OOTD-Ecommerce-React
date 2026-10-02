const express = require('express');
const cors = require('cors');

const auth = require('./routes/auth');

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ success: true, message: 'OOTD API is running' });
});

app.use('/api/v1', auth);

// Unknown route
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Central error handler (Express 5 sends async errors here automatically)
app.use((err, req, res, next) => {
    console.error(err);

    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((e) => e.message).join(', ');
        return res.status(400).json({ success: false, message });
    }
    if (err.code === 11000) {
        return res.status(400).json({ success: false, message: 'Duplicate value: that record already exists' });
    }

    res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Server error' });
});

module.exports = app;