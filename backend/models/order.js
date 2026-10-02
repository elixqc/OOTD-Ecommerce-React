const mongoose = require('mongoose');
const { ORDER_STATUSES } = require('../utils/constants');

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        shippingInfo: {
            address: { type: String, required: true },
            city: { type: String, required: true },
            phoneNo: { type: String, required: true },
            postalCode: { type: String, required: true },
            country: { type: String, required: true },
        },
        orderItems: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                name: { type: String, required: true },
                image: { type: String, required: true },
                size: { type: String, required: true },
                color: { type: String, required: true },
                price: { type: Number, required: true },
                quantity: { type: Number, required: true, min: 1 },
            },
        ],
        paymentMethod: {
            type: String,
            default: 'Cash on Delivery',
        },
        itemsPrice: { type: Number, required: true, default: 0 },
        shippingPrice: { type: Number, required: true, default: 0 },
        totalPrice: { type: Number, required: true, default: 0 },
        orderStatus: {
            type: String,
            enum: ORDER_STATUSES,
            default: 'Processing',
        },
        deliveredAt: { type: Date },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);