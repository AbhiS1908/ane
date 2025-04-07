const mongoose = require('mongoose');

const SuttaVendorSchema = new mongoose.Schema({
    vendorStockId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorStock', required: true },
    quantity: { type: Number },
    ratePerKg: { type: Number},
    count: { type: Number },
    totalCost: { type: Number, default: 0 } // This will be auto-calculated
});

// Middleware to auto-calculate totalCost before saving
SuttaVendorSchema.pre('save', function(next) {
    this.totalCost = this.quantity * this.ratePerKg * this.count;
    next();
});

module.exports = mongoose.model('SuttaVendor', SuttaVendorSchema);