const mongoose = require('mongoose');

const expenseDSchema = new mongoose.Schema({
    sNo: { type: Number },
    particular: { type: String },
    subField: { type: String },
    receipt: { type: Number },
    amountPaid: { type: Number },
    balance: { type: Number },
    paidTo: { type: String },
    approvedBy: { type: String },
    date: Date

}, { timestamps: true });

module.exports = mongoose.model('ExpenseD', expenseDSchema);