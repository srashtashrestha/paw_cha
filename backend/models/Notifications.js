const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['approval', 'rejection', 'message'], required: true },
    message: { type: String, required: true },
    petId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet' },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);