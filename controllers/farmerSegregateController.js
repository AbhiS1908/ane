const FarmerStock = require('../models/farmerStockModel');
const FarmerSegregate = require('../models/farmerSegregateModel');

// Create a farmer Form linked to farmer ID
exports.createFarmerSegregate = async (req, res) => {
    try {
        const { farmerStockId, percentage, makhana, totalWeight, ratePerKg, finalPrice, transportationCharge, totalPriceStandard, totalPriceFinal } = req.body;

        const farmerStock = await FarmerStock.findById(farmerStockId);
        if (!farmerStock) {
            return res.status(404).json({ error: 'farmer Stock not found' });
        }

        const farmerSegregate = new FarmerSegregate({
            farmerStockId,
            percentage,
            makhana,
            totalWeight,
            ratePerKg,
            finalPrice,
            transportationCharge,
            totalPriceStandard,
            totalPriceFinal
        });

        await farmerSegregate.save();

        farmerStock.finalPrices.push(finalPrice);
        if (!farmerStock.totalWeight1) {
            farmerStock.totalWeight1 = totalWeight;
        } else if (!farmerStock.totalWeight2) {
            farmerStock.totalWeight2 = totalWeight;
        } else if (!farmerStock.totalWeight3) {
            farmerStock.totalWeight3 = totalWeight;
        } else if (!farmerStock.totalWeight4) {
            farmerStock.totalWeight4 = totalWeight;
        } else if (!farmerStock.totalWeight5) {
            farmerStock.totalWeight5 = totalWeight;
        } else if (!farmerStock.totalWeight6) {
            farmerStock.totalWeight6 = totalWeight;
        } else {
            return res.status(400).json({ error: 'All 6 totalWeight fields are already filled' });
        }
        await farmerStock.save();

        // Update totals in farmerStock
        const aggregation = await FarmerSegregate.aggregate([
            { $match: { farmerStockId: farmerStock._id } },
            {
                $group: {
                    _id: "$farmerStockId",
                    finalTotalWeight: { $sum: "$totalWeight" },
                    totalFinalPrice: { $sum: "$finalPrice" },
                    finalTotalPriceStandard: { $sum: "$totalPriceStandard" },
                    finalTotalPriceFinal: { $sum: "$totalPriceFinal" }
                }
            }
        ]);

        if (aggregation.length > 0) {
            await FarmerStock.findByIdAndUpdate(farmerStockId, {
                finalTotalWeight: aggregation[0].finalTotalWeight,
                totalFinalPrice: aggregation[0].totalFinalPrice,
                finalTotalPriceStandard: aggregation[0].finalTotalPriceStandard,
                finalTotalPriceFinal: aggregation[0].finalTotalPriceFinal
            });
        }

        res.status(201).json({ message: 'farmer Segregation created successfully', farmerSegregate });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating Cash Segregation' });
    }
};

// Get all Cash Entries
exports.getAllFarmerSegregate = async (req, res) => {
    try {
        const farmerEntries = await FarmerSegregate.find();
        res.status(200).json(farmerEntries);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching Cash entries' });
    }
};

// Get Cash Form by Cash ID
// exports.getFarmerSegregateByFarmerId = async (req, res) => {
//     try {
//         const { farmerStockId } = req.params;
//         const farmerSegregate = await FarmerSegregate.findOne({ farmerStockId }).populate('cashId');
//         if (!farmerSegregate) {
//             return res.status(404).json({ error: 'Cash Form not found' });
//         }
//         res.status(200).json(farmerSegregate);
//     } catch (error) {
//         res.status(500).json({ error: 'Error fetching Cash Form' });
//     }
// };

exports.getFarmerSegregateByFarmerId = async (req, res) => {
    try {
        const { farmerStockId } = req.params;

        // Fetch all cashStock records related to the given cashFormId
        const farmerSegregate = await FarmerSegregate.find({ farmerStockId }).populate('farmerStockId');

        if (!farmerSegregate || farmerSegregate.length === 0) {
            return res.status(404).json({ error: 'No Cash Stock entries found for this Cash Form ID' });
        }

        // Map the data to extract only required fields
        const formattedData = farmerSegregate.map(stock => ({
            _id: stock._id,
            farmerStockId: stock.farmerStockId._id,
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
exports.updateFarmerSegregate = async (req, res) => {
    try {
        const { id } = req.params;

        // Retrieve the existing farmerSegregate document before update
        const existingFarmerSegregate = await FarmerSegregate.findById(id);
        if (!existingFarmerSegregate) {
            return res.status(404).json({ error: 'Farmer Form not found' });
        }

        const farmerStockId = existingFarmerSegregate.farmerStockId;
        const farmerStock = await FarmerStock.findById(farmerStockId);
        if (!farmerStock) {
            return res.status(404).json({ error: 'farmer Stock not found' });
        }

        // Fetch all farmerSegregate entries for the farmerStock sorted by creation time
        const farmerSegregates = await FarmerSegregate.find({ farmerStockId }).sort({ createdAt: 1 });

        // Determine the index of the current farmerSegregate entry
        const index = farmerSegregates.findIndex(cs => cs._id.equals(id));
        if (index === -1) {
            return res.status(404).json({ error: 'farmer Segregate not found in farmer Stock' });
        }

        // Validate the index to ensure it's within the allowed range (0-5)
        if (index < 0 || index >= 6) {
            return res.status(400).json({ error: 'Invalid farmer Segregate index' });
        }

        // Update the farmerSegregate with new data
        const updatedFarmerSegregate = await FarmerSegregate.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
        );

        // Determine which totalWeight field to update in farmerStock (totalWeight1 to totalWeight6)
        const totalWeightField = `totalWeight${index + 1}`;
        farmerStock[totalWeightField] = updatedFarmerSegregate.totalWeight;

        // Update the finalPrices array if the finalPrice has changed
        const oldFinalPrice = existingFarmerSegregate.finalPrice;
        const newFinalPrice = updatedFarmerSegregate.finalPrice;
        if (oldFinalPrice !== newFinalPrice) {
            if (farmerStock.finalPrices.length > index) {
                farmerStock.finalPrices[index] = newFinalPrice;
            } else {
                return res.status(500).json({ error: 'Final prices array inconsistency detected' });
            }
        }

        // Save the updated farmerStock
        await farmerStock.save();

        // Recalculate aggregated totals using all farmerSegregate entries
        const aggregation = await FarmerSegregate.aggregate([
            { $match: { farmerStockId: farmerStock._id } },
            {
                $group: {
                    _id: "$farmerStockId",
                    finalTotalWeight: { $sum: "$totalWeight" },
                    totalFinalPrice: { $sum: "$finalPrice" },
                    finalTotalPriceStandard: { $sum: "$totalPriceStandard" },
                    finalTotalPriceFinal: { $sum: "$totalPriceFinal" }
                }
            }
        ]);

        // Update farmerStock with the new aggregated totals
        if (aggregation.length > 0) {
            await FarmerStock.findByIdAndUpdate(farmerStockId, {
                finalTotalWeight: aggregation[0].finalTotalWeight,
                totalFinalPrice: aggregation[0].totalFinalPrice,
                finalTotalPriceStandard: aggregation[0].finalTotalPriceStandard,
                finalTotalPriceFinal: aggregation[0].finalTotalPriceFinal
            });
        }

        res.status(200).json({ message: 'farmer Form updated successfully', updatedFarmerSegregate });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating farmer Form', details: error.message });
    }
};


// Delete a Cash Entry and associated Cash Form
exports.deleteFarmerSegregate = async (req, res) => {
    try {
        const { id } = req.params; // Use the document's unique _id

        const deletedFarmerSegregate = await FarmerSegregate.findByIdAndDelete(id);
        if (!deletedFarmerSegregate) {
            return res.status(404).json({ error: 'Cash Form not found' });
        }

        res.status(200).json({ message: 'Cash Form deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting Cash Form' });
    }
};

