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

        // Mapping makhana types to specific indices
        const makhanaMapping = {
            "6 Sutta": 0,
            "5 Sutta": 1,
            "4 Sutta": 2,
            "3 Sutta": 3,
            "Other": 4,
            "Waste": 5
        };

        const index = makhanaMapping[makhana];
        if (index === undefined) {
            return res.status(400).json({ error: 'Invalid makhana value' });
        }

        // Ensure finalPrices array has 6 elements
        if (!cashStock.finalPrices) {
            cashStock.finalPrices = Array(6).fill(null);
        }

        cashStock.finalPrices[index] = finalPrice; // Assign finalPrice to the correct index

        // Store totalWeight in the appropriate field
        switch (index) {
            case 0: cashStock.totalWeight1 = totalWeight; break;
            case 1: cashStock.totalWeight2 = totalWeight; break;
            case 2: cashStock.totalWeight3 = totalWeight; break;
            case 3: cashStock.totalWeight4 = totalWeight; break;
            case 4: cashStock.totalWeight5 = totalWeight; break;
            case 5: cashStock.totalWeight6 = totalWeight; break;
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

        const makhanaMapping = {
            "6 Sutta": 0,
            "5 Sutta": 1,
            "4 Sutta": 2,
            "3 Sutta": 3,
            "Other": 4,
            "Waste": 5
        };

        // Retrieve existing CashSegregate to get old makhana and index
        const existingCashSegregate = await CashSegregate.findById(id);
        if (!existingCashSegregate) {
            return res.status(404).json({ error: 'Cash Form not found' });
        }

        const oldMakhana = existingCashSegregate.makhana;
        const oldIndex = makhanaMapping[oldMakhana];
        if (oldIndex === undefined) {
            return res.status(400).json({ error: 'Invalid old makhana value' });
        }

        const cashStockId = existingCashSegregate.cashStockId;
        const cashStock = await CashStock.findById(cashStockId);
        if (!cashStock) {
            return res.status(404).json({ error: 'Cash Stock not found' });
        }

        // Update the CashSegregate with new data
        const updatedCashSegregate = await CashSegregate.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
        );

        const newMakhana = updatedCashSegregate.makhana;
        const newIndex = makhanaMapping[newMakhana];
        if (newIndex === undefined) {
            return res.status(400).json({ error: 'Invalid new makhana value' });
        }

        // Handle changes in makhana type (index)
        if (oldIndex !== newIndex) {
            // Clear old index data in CashStock
            cashStock[`totalWeight${oldIndex + 1}`] = null;
            if (cashStock.finalPrices && cashStock.finalPrices.length > oldIndex) {
                cashStock.finalPrices[oldIndex] = null;
            }

            // Set new index data in CashStock
            cashStock[`totalWeight${newIndex + 1}`] = updatedCashSegregate.totalWeight;
            if (!cashStock.finalPrices) {
                cashStock.finalPrices = Array(6).fill(null);
            }
            if (cashStock.finalPrices.length <= newIndex) {
                cashStock.finalPrices = [...cashStock.finalPrices, ...Array(6 - cashStock.finalPrices.length).fill(null)];
            }
            cashStock.finalPrices[newIndex] = updatedCashSegregate.finalPrice;
        } else {
            // Update existing index data in CashStock
            cashStock[`totalWeight${oldIndex + 1}`] = updatedCashSegregate.totalWeight;
            if (!cashStock.finalPrices) {
                cashStock.finalPrices = Array(6).fill(null);
            }
            if (cashStock.finalPrices.length <= oldIndex) {
                cashStock.finalPrices = [...cashStock.finalPrices, ...Array(6 - cashStock.finalPrices.length).fill(null)];
            }
            cashStock.finalPrices[oldIndex] = updatedCashSegregate.finalPrice;
        }

        await cashStock.save();

        // Recalculate aggregated totals
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

        res.status(200).json({ message: 'Cash Form updated successfully', updatedCashSegregate });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating Cash Form', details: error.message });
    }
};


// Delete a Cash Entry and associated Cash Form
exports.deleteCashSegregate = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedCashSegregate = await CashSegregate.findByIdAndDelete(id);
        if (!deletedCashSegregate) {
            return res.status(404).json({ error: 'Cash Form not found' });
        }

        const cashStockId = deletedCashSegregate.cashStockId;
        const cashStock = await CashStock.findById(cashStockId);
        if (!cashStock) {
            return res.status(404).json({ error: 'Cash Stock not found' });
        }

        const makhanaMapping = {
            "6 Sutta": 0,
            "5 Sutta": 1,
            "4 Sutta": 2,
            "3 Sutta": 3,
            "Other": 4,
            "Waste": 5
        };

        const makhana = deletedCashSegregate.makhana;
        const index = makhanaMapping[makhana];
        if (index === undefined) {
            return res.status(400).json({ error: 'Invalid makhana value in deleted entry' });
        }

        // Reset corresponding totalWeight and finalPrice
        cashStock[`totalWeight${index + 1}`] = null;
        if (cashStock.finalPrices && cashStock.finalPrices.length > index) {
            cashStock.finalPrices[index] = null;
        }
        await cashStock.save();

        // Recalculate aggregated totals
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

        const updateData = aggregation.length > 0 ? {
            finalTotalWeight: aggregation[0].finalTotalWeight,
            totalFinalPrice: aggregation[0].totalFinalPrice,
            finalTotalPriceStandard: aggregation[0].finalTotalPriceStandard,
            finalTotalPriceFinal: aggregation[0].finalTotalPriceFinal
        } : {
            finalTotalWeight: 0,
            totalFinalPrice: 0,
            finalTotalPriceStandard: 0,
            finalTotalPriceFinal: 0
        };

        await CashStock.findByIdAndUpdate(cashStockId, updateData);

        res.status(200).json({ message: 'Cash Form deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting Cash Form', details: error.message });
    }
};