const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    inquiryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inquiry' },
    lastMessage: { type: String },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Chat", ChatSchema);