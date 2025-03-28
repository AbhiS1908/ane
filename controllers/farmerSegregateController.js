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
        if (!farmerStock.finalPrices) {
            farmerStock.finalPrices = Array(6).fill(null);
        }

        farmerStock.finalPrices[index] = finalPrice; // Assign finalPrice to the correct index

        // Store totalWeight in the appropriate field
        switch (index) {
            case 0: farmerStock.totalWeight1 = totalWeight; break;
            case 1: farmerStock.totalWeight2 = totalWeight; break;
            case 2: farmerStock.totalWeight3 = totalWeight; break;
            case 3: farmerStock.totalWeight4 = totalWeight; break;
            case 4: farmerStock.totalWeight5 = totalWeight; break;
            case 5: farmerStock.totalWeight6 = totalWeight; break;
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
        res.status(500).json({ error: 'Error creating farmer Segregation' });
    }
};

// Get all farmer Entries
exports.getAllFarmerSegregate = async (req, res) => {
    try {
        const farmerEntries = await FarmerSegregate.find();
        res.status(200).json(farmerEntries);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching farmer entries' });
    }
};

// Get farmer Form by farmer ID
// exports.getFarmerSegregateByFarmerId = async (req, res) => {
//     try {
//         const { farmerStockId } = req.params;
//         const farmerSegregate = await FarmerSegregate.findOne({ farmerStockId }).populate('farmerId');
//         if (!farmerSegregate) {
//             return res.status(404).json({ error: 'farmer Form not found' });
//         }
//         res.status(200).json(farmerSegregate);
//     } catch (error) {
//         res.status(500).json({ error: 'Error fetching farmer Form' });
//     }
// };

exports.getFarmerSegregateByFarmerId = async (req, res) => {
    try {
        const { farmerStockId } = req.params;

        // Fetch all farmerStock records related to the given farmerFormId
        const farmerSegregate = await FarmerSegregate.find({ farmerStockId }).populate('farmerStockId');

        if (!farmerSegregate || farmerSegregate.length === 0) {
            return res.status(404).json({ error: 'No farmer Stock entries found for this farmer Form ID' });
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
        res.status(500).json({ error: 'Error fetching farmer Stock entries', details: error.message });
    }
};

// Update a farmer Form
exports.updateFarmerSegregate = async (req, res) => {
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

        // Retrieve existing FarmerSegregate to get old makhana and index
        const existingFarmerSegregate = await FarmerSegregate.findById(id);
        if (!existingFarmerSegregate) {
            return res.status(404).json({ error: 'Farmer Form not found' });
        }

        const oldMakhana = existingFarmerSegregate.makhana;
        const oldIndex = makhanaMapping[oldMakhana];
        if (oldIndex === undefined) {
            return res.status(400).json({ error: 'Invalid old makhana value' });
        }

        const farmerStockId = existingFarmerSegregate.farmerStockId;
        const farmerStock = await FarmerStock.findById(farmerStockId);
        if (!farmerStock) {
            return res.status(404).json({ error: 'farmer Stock not found' });
        }

        // Update the farmerSegregate with new data
        const updatedFarmerSegregate = await FarmerSegregate.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
        );

        const newMakhana = updatedFarmerSegregate.makhana;
        const newIndex = makhanaMapping[newMakhana];
        if (newIndex === undefined) {
            return res.status(400).json({ error: 'Invalid new makhana value' });
        }

        // Handle changes in makhana type (index)
        if (oldIndex !== newIndex) {
            // Clear old index data in FarmerStock
            farmerStock[`totalWeight${oldIndex + 1}`] = null;
            if (farmerStock.finalPrices && farmerStock.finalPrices.length > oldIndex) {
                farmerStock.finalPrices[oldIndex] = null;
            }

            // Set new index data in farmerStock
            farmerStock[`totalWeight${newIndex + 1}`] = updatedFarmerSegregate.totalWeight;
            if (!farmerStock.finalPrices) {
                farmerStock.finalPrices = Array(6).fill(null);
            }
            if (farmerStock.finalPrices.length <= newIndex) {
                farmerStock.finalPrices = [...farmerStock.finalPrices, ...Array(6 - farmerStock.finalPrices.length).fill(null)];
            }
            farmerStock.finalPrices[newIndex] = updatedFarmerSegregate.finalPrice;
        } else {
            // Update existing index data in FarmerStock
            farmerStock[`totalWeight${oldIndex + 1}`] = updatedFarmerSegregate.totalWeight;
            if (!farmerStock.finalPrices) {
                farmerStock.finalPrices = Array(6).fill(null);
            }
            if (farmerStock.finalPrices.length <= oldIndex) {
                farmerStock.finalPrices = [...farmerStock.finalPrices, ...Array(6 - farmerStock.finalPrices.length).fill(null)];
            }
            farmerStock.finalPrices[oldIndex] = updatedFarmerSegregate.finalPrice;
        }

        await farmerStock.save();

        // Recalculate aggregated totals
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

        res.status(200).json({ message: 'farmer Form updated successfully', updatedFarmerSegregate });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating Farmer Form', details: error.message });
    }
};


// Delete a Farmer Entry and associated Farmer Form
exports.deleteFarmerSegregate = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedFarmerSegregate = await FarmerSegregate.findByIdAndDelete(id);
        if (!deletedFarmerSegregate) {
            return res.status(404).json({ error: 'Farmer Form not found' });
        }

        const farmerStockId = deletedFarmerSegregate.farmerStockId;
        const farmerStock = await FarmerStock.findById(farmerStockId);
        if (!farmerStock) {
            return res.status(404).json({ error: 'farmer Stock not found' });
        }

        const makhanaMapping = {
            "6 Sutta": 0,
            "5 Sutta": 1,
            "4 Sutta": 2,
            "3 Sutta": 3,
            "Other": 4,
            "Waste": 5
        };

        const makhana = deletedFarmerSegregate.makhana;
        const index = makhanaMapping[makhana];
        if (index === undefined) {
            return res.status(400).json({ error: 'Invalid makhana value in deleted entry' });
        }

        // Reset corresponding totalWeight and finalPrice
        farmerStock[`totalWeight${index + 1}`] = null;
        if (farmerStock.finalPrices && farmerStock.finalPrices.length > index) {
            farmerStock.finalPrices[index] = null;
        }
        await farmerStock.save();

        // Recalculate aggregated totals
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

        await FarmerStock.findByIdAndUpdate(farmerStockId, updateData);

        res.status(200).json({ message: 'farmer Form deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting farmer Form', details: error.message });
    }
};