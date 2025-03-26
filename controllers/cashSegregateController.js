const CashStock = require('../models/cashStockModel');
const CashSegregate = require('../models/cashSegregateModel');

// Create a Cash Form linked to Cash ID
exports.createCashSegregate = async (req, res) => {
    try {
        const { cashStockId, percentage, makhana, totalWeight, ratePerKg, finalPrice, transportationCharge, totalPriceStandard, totalPriceFinal } = req.body;

        const cashStock = await CashStock.findById(cashStockId);
        if (!cashStock) {
            return res.status(404).json({ error: 'Cash Stock not found' });
        }

        const cashSegregate = new CashSegregate({
            cashStockId,
            percentage,
            makhana,
            totalWeight,
            ratePerKg,
            finalPrice,
            transportationCharge,
            totalPriceStandard,
            totalPriceFinal
        });

        await cashSegregate.save();

        cashStock.finalPrices.push(finalPrice);
        // Store the totalWeight in the appropriate field
        if (!cashStock.totalWeight1) {
            cashStock.totalWeight1 = totalWeight;
        } else if (!cashStock.totalWeight2) {
            cashStock.totalWeight2 = totalWeight;
        } else if (!cashStock.totalWeight3) {
            cashStock.totalWeight3 = totalWeight;
        } else if (!cashStock.totalWeight4) {
            cashStock.totalWeight4 = totalWeight;
        } else if (!cashStock.totalWeight5) {
            cashStock.totalWeight5 = totalWeight;
        } else if (!cashStock.totalWeight6) {
            cashStock.totalWeight6 = totalWeight;
        } else {
            return res.status(400).json({ error: 'All 6 totalWeight fields are already filled' });
        }
        await cashStock.save();

        // Update totals in CashStock
        const aggregation = await CashSegregate.aggregate([
            { $match: { cashStockId: cashStock._id } },
            {
                $group: {
                    _id: "$cashStockId",
                    finalTotalWeight: { $sum: "$totalWeight" },
                    totalFinalPrice: { $sum: "$finalPrice" },
                    finalTotalPriceStandard: { $sum: "$totalPriceStandard" },
                    finalTotalPriceFinal: { $sum: "$totalPriceFinal" }
                }
            }
        ]);

        if (aggregation.length > 0) {
            await CashStock.findByIdAndUpdate(cashStockId, {
                finalTotalWeight: aggregation[0].finalTotalWeight,
                totalFinalPrice: aggregation[0].totalFinalPrice,
                finalTotalPriceStandard: aggregation[0].finalTotalPriceStandard,
                finalTotalPriceFinal: aggregation[0].finalTotalPriceFinal
            });
        }

        res.status(201).json({ message: 'Cash Segregation created successfully', cashSegregate });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating Cash Segregation' });
    }
};


// Get all Cash Entries
exports.getAllCashSegregate = async (req, res) => {
    try {
        const cashEntries = await CashSegregate.find();
        res.status(200).json(cashEntries);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching Cash entries' });
    }
};

// Get Cash Form by Cash ID
// exports.getCashSegregateByCashId = async (req, res) => {
//     try {
//         const { cashStockId } = req.params;
//         const cashSegregate = await CashSegregate.findOne({ cashStockId }).populate('cashId');
//         if (!cashSegregate) {
//             return res.status(404).json({ error: 'Cash Form not found' });
//         }
//         res.status(200).json(cashSegregate);
//     } catch (error) {
//         res.status(500).json({ error: 'Error fetching Cash Form' });
//     }
// };

exports.getCashSegregateByCashId = async (req, res) => {
    try {
        const { cashStockId } = req.params;

        // Fetch all cashStock records related to the given cashFormId
        const cashSegregate = await CashSegregate.find({ cashStockId }).populate('cashStockId');

        if (!cashSegregate || cashSegregate.length === 0) {
            return res.status(404).json({ error: 'No Cash Stock entries found for this Cash Form ID' });
        }

        // Map the data to extract only required fields
        const formattedData = cashSegregate.map(stock => ({
            _id: stock._id,
            cashStockId: stock.cashStockId._id,
            percentage: stock.percentage,
            makhana: stock.makhana, 
            totalWeight: stock.totalWeight,
            ratePerKg: stock.ratePerKg,
            finalPrice: stock.finalPrice,
            transportationCharge: stock.transportationCharge,
            totalPriceStandard: stock.totalPriceStandard,
            totalPriceFinal: stock.totalPriceFinal
        }));

        res.status(200).json(formattedData);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching Cash Stock entries', details: error.message });
    }
};

// Update a Cash Form
exports.updateCashSegregate = async (req, res) => {
    try {
        const { id } = req.params;

        // Retrieve the existing CashSegregate document before update
        const existingCashSegregate = await CashSegregate.findById(id);
        if (!existingCashSegregate) {
            return res.status(404).json({ error: 'Cash Form not found' });
        }

        const cashStockId = existingCashSegregate.cashStockId;
        const cashStock = await CashStock.findById(cashStockId);
        if (!cashStock) {
            return res.status(404).json({ error: 'Cash Stock not found' });
        }

        // Fetch all CashSegregate entries for the CashStock sorted by creation time
        const cashSegregates = await CashSegregate.find({ cashStockId }).sort({ createdAt: 1 });

        // Determine the index of the current CashSegregate entry
        const index = cashSegregates.findIndex(cs => cs._id.equals(id));
        if (index === -1) {
            return res.status(404).json({ error: 'Cash Segregate not found in Cash Stock' });
        }

        // Validate the index to ensure it's within the allowed range (0-5)
        if (index < 0 || index >= 6) {
            return res.status(400).json({ error: 'Invalid Cash Segregate index' });
        }

        // Update the CashSegregate with new data
        const updatedCashSegregate = await CashSegregate.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
        );

        // Determine which totalWeight field to update in CashStock (totalWeight1 to totalWeight6)
        const totalWeightField = `totalWeight${index + 1}`;
        cashStock[totalWeightField] = updatedCashSegregate.totalWeight;

        // Update the finalPrices array if the finalPrice has changed
        const oldFinalPrice = existingCashSegregate.finalPrice;
        const newFinalPrice = updatedCashSegregate.finalPrice;
        if (oldFinalPrice !== newFinalPrice) {
            if (cashStock.finalPrices.length > index) {
                cashStock.finalPrices[index] = newFinalPrice;
            } else {
                return res.status(500).json({ error: 'Final prices array inconsistency detected' });
            }
        }

        // Save the updated CashStock
        await cashStock.save();

        // Recalculate aggregated totals using all CashSegregate entries
        const aggregation = await CashSegregate.aggregate([
            { $match: { cashStockId: cashStock._id } },
            {
                $group: {
                    _id: "$cashStockId",
                    finalTotalWeight: { $sum: "$totalWeight" },
                    totalFinalPrice: { $sum: "$finalPrice" },
                    finalTotalPriceStandard: { $sum: "$totalPriceStandard" },
                    finalTotalPriceFinal: { $sum: "$totalPriceFinal" }
                }
            }
        ]);

        // Update CashStock with the new aggregated totals
        if (aggregation.length > 0) {
            await CashStock.findByIdAndUpdate(cashStockId, {
                finalTotalWeight: aggregation[0].finalTotalWeight,
                totalFinalPrice: aggregation[0].totalFinalPrice,
                finalTotalPriceStandard: aggregation[0].finalTotalPriceStandard,
                finalTotalPriceFinal: aggregation[0].finalTotalPriceFinal
            });
        }

        res.status(200).json({ message: 'Cash Form updated successfully', updatedCashSegregate });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating Cash Form', details: error.message });
    }
};


// Delete a Cash Entry and associated Cash Form
exports.deleteCashSegregate = async (req, res) => {
    try {
        const { id } = req.params; // Use the document's unique _id

        const deletedCashSegregate = await CashSegregate.findByIdAndDelete(id);
        if (!deletedCashSegregate) {
            return res.status(404).json({ error: 'Cash Form not found' });
        }

        res.status(200).json({ message: 'Cash Form deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting Cash Form' });
    }
};

