const mongoose = require('mongoose');

const VendorStockSchema = new mongoose.Schema({
    vendorFormId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorForm', required: true },
    vendorName: String,
    particular: String,
    hsn: String,
    quantity: String,
    rate: String,
    pricePerKgBag: String,
    gst: String,
    amount: Number,
    weight: String,
    amountPaid: Number,
    amountLeft: Number,
    status: String,
    totalBagWeight: { type: Number, default: 0 },
    totalPurchaseRate: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    actualValue: { type: Number, default: 0 },
    valueDiff: { type: Number, default: 0 },

    finalTotalWeight: { type: Number, default: 0 },
    totalFinalPrice: { type: Number, default: 0 },
    finalTotalPriceStandard: { type: Number, default: 0 },
    finalTotalPriceFinal: { type: Number, default: 0 },
    profit: Number,
    finalPrices: [{ type: Number }],
    product: String,

    totalWeight1: { type: Number, default: 0 },
    totalWeight2: { type: Number, default: 0 },
    totalWeight3: { type: Number, default: 0 },
    totalWeight4: { type: Number, default: 0 },
    totalWeight5: { type: Number, default: 0 },
    totalWeight6: { type: Number, default: 0 },
    poNo: String,
    transportationCost: { type: Number, default: 0 }, // Add this line


});
module.exports = mongoose.model('VendorStock', VendorStockSchema);