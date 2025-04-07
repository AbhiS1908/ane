const mongoose = require('mongoose');

const SutaCashSchema = new mongoose.Schema({
    cashStockId: { type: mongoose.Schema.Types.ObjectId, ref: 'CashStock', required: true },
    quantity: { type: Number },
    ratePerKg: { type: Number},
    count: { type: Number },
    totalCost: { type: Number, default: 0 } // This will be auto-calculated
});

// Middleware to auto-calculate totalCost before saving
SutaCashSchema.pre('save', function(next) {
    this.totalCost = this.quantity * this.ratePerKg * this.count;
    next();
});

module.exports = mongoose.model('SutaCash', SutaCashSchema);