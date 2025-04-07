const mongoose = require('mongoose');

const SuttaFarmerSchema = new mongoose.Schema({
    farmerStockId: { type: mongoose.Schema.Types.ObjectId, ref: 'FarmerStock', required: true },
    quantity: { type: Number },
    ratePerKg: { type: Number},
    count: { type: Number },
    totalCost: { type: Number, default: 0 } // This will be auto-calculated
});

// Middleware to auto-calculate totalCost before saving
SuttaFarmerSchema.pre('save', function(next) {
    this.totalCost = this.quantity * this.ratePerKg * this.count;
    next();
});

module.exports = mongoose.model('SuttaFarmer', SuttaFarmerSchema);