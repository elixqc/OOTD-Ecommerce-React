const express = require('express');
const cors = require('cors');

const auth = require('./routes/auth');
const products = require('./routes/product');
const orders = require('./routes/order');
const reviews = require('./routes/review');

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ success: true, message: 'OOTD API is running' });
});

app.use('/api/v1', auth);
app.use('/api/v1', products);
app.use('/api/v1', orders);
app.use('/api/v1', reviews);

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
    if (err.name === 'CastError') {
        return res.status(400).json({ success: false, message: `Invalid ${err.path}: ${err.value}` });
    }
    if (err.code === 11000) {
        return res.status(400).json({ success: false, message: 'Duplicate value: that record already exists' });
    }

    res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Server error' });
});

module.exports = app;