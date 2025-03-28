const VendorStock = require('../models/vendorStockModel');
const VendorSegregate = require('../models/vendorSegregateModel');

// Create a vendor Form linked to vendor ID
exports.createVendorSegregate = async (req, res) => {
    try {
        const { vendorStockId, percentage, makhana, totalWeight, ratePerKg, finalPrice, transportationCharge, totalPriceStandard, totalPriceFinal } = req.body;

        const vendorStock = await VendorStock.findById(vendorStockId);
        if (!vendorStock) {
            return res.status(404).json({ error: 'vendor Stock not found' });
        }

        const vendorSegregate = new VendorSegregate({
            vendorStockId,
            percentage,
            makhana,
            totalWeight,
            ratePerKg,
            finalPrice,
            transportationCharge,
            totalPriceStandard,
            totalPriceFinal
        });

        await vendorSegregate.save();

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
        if (!vendorStock.finalPrices) {
            vendorStock.finalPrices = Array(6).fill(null);
        }

        vendorStock.finalPrices[index] = finalPrice; // Assign finalPrice to the correct index

        // Store totalWeight in the appropriate field
        switch (index) {
            case 0: vendorStock.totalWeight1 = totalWeight; break;
            case 1: vendorStock.totalWeight2 = totalWeight; break;
            case 2: vendorStock.totalWeight3 = totalWeight; break;
            case 3: vendorStock.totalWeight4 = totalWeight; break;
            case 4: vendorStock.totalWeight5 = totalWeight; break;
            case 5: vendorStock.totalWeight6 = totalWeight; break;
        }

        await vendorStock.save();

        // Update totals in vendorStock
        const aggregation = await VendorSegregate.aggregate([
            { $match: { vendorStockId: vendorStock._id } },
            {
                $group: {
                    _id: "$vendorStockId",
                    finalTotalWeight: { $sum: "$totalWeight" },
                    totalFinalPrice: { $sum: "$finalPrice" },
                    finalTotalPriceStandard: { $sum: "$totalPriceStandard" },
                    finalTotalPriceFinal: { $sum: "$totalPriceFinal" }
                }
            }
        ]);

        if (aggregation.length > 0) {
            await VendorStock.findByIdAndUpdate(vendorStockId, {
                finalTotalWeight: aggregation[0].finalTotalWeight,
                totalFinalPrice: aggregation[0].totalFinalPrice,
                finalTotalPriceStandard: aggregation[0].finalTotalPriceStandard,
                finalTotalPriceFinal: aggregation[0].finalTotalPriceFinal
            });
        }

        res.status(201).json({ message: 'vendor Segregation created successfully', vendorSegregate });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating vendor Segregation' });
    }
};

// Get all Vendor Entries
exports.getAllVendorSegregate = async (req, res) => {
    try {
        const vendorEntries = await VendorSegregate.find();
        res.status(200).json(vendorEntries);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching Vendor entries' });
    }
};

// Get Vendor Form by Vendor ID
// exports.getVendorSegregateByVendorId = async (req, res) => {
//     try {
//         const { vendorStockId } = req.params;
//         const vendorSegregate = await VendorSegregate.findOne({ vendorStockId }).populate('vendorId');
//         if (!vendorSegregate) {
//             return res.status(404).json({ error: 'Vendor Form not found' });
//         }
//         res.status(200).json(vendorSegregate);
//     } catch (error) {
//         res.status(500).json({ error: 'Error fetching Vendor Form' });
//     }
// };

exports.getVendorSegregateByVendorId = async (req, res) => {
    try {
        const { vendorStockId } = req.params;

        // Fetch all VendorStock records related to the given VendorFormId
        const vendorSegregate = await VendorSegregate.find({ vendorStockId }).populate('vendorStockId');

        if (!vendorSegregate || vendorSegregate.length === 0) {
            return res.status(404).json({ error: 'No Vendor Stock entries found for this Vendor Form ID' });
        }

        // Map the data to extract only required fields
        const formattedData = vendorSegregate.map(stock => ({
            _id: stock._id,
            vendorStockId: stock.vendorStockId._id,
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
        res.status(500).json({ error: 'Error fetching Vendor Stock entries', details: error.message });
    }
};

// Update a Vendor Form
exports.updateVendorSegregate = async (req, res) => {
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

        // Retrieve existing VendorSegregate to get old makhana and index
        const existingVendorSegregate = await VendorSegregate.findById(id);
        if (!existingVendorSegregate) {
            return res.status(404).json({ error: 'Vendor Form not found' });
        }

        const oldMakhana = existingVendorSegregate.makhana;
        const oldIndex = makhanaMapping[oldMakhana];
        if (oldIndex === undefined) {
            return res.status(400).json({ error: 'Invalid old makhana value' });
        }

        const vendorStockId = existingVendorSegregate.vendorStockId;
        const vendorStock = await VendorStock.findById(vendorStockId);
        if (!vendorStock) {
            return res.status(404).json({ error: 'vendor Stock not found' });
        }

        // Update the VendorSegregate with new data
        const updatedVendorSegregate = await VendorSegregate.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
        );

        const newMakhana = updatedVendorSegregate.makhana;
        const newIndex = makhanaMapping[newMakhana];
        if (newIndex === undefined) {
            return res.status(400).json({ error: 'Invalid new makhana value' });
        }

        // Handle changes in makhana type (index)
        if (oldIndex !== newIndex) {
            // Clear old index data in VendorStock
            vendorStock[`totalWeight${oldIndex + 1}`] = null;
            if (vendorStock.finalPrices && vendorStock.finalPrices.length > oldIndex) {
                vendorStock.finalPrices[oldIndex] = null;
            }

            // Set new index data in vendorStock
            vendorStock[`totalWeight${newIndex + 1}`] = updatedVendorSegregate.totalWeight;
            if (!vendorStock.finalPrices) {
                vendorStock.finalPrices = Array(6).fill(null);
            }
            if (vendorStock.finalPrices.length <= newIndex) {
                vendorStock.finalPrices = [...vendorStock.finalPrices, ...Array(6 - vendorStock.finalPrices.length).fill(null)];
            }
            vendorStock.finalPrices[newIndex] = updatedVendorSegregate.finalPrice;
        } else {
            // Update existing index data in VendorStock
            vendorStock[`totalWeight${oldIndex + 1}`] = updatedVendorSegregate.totalWeight;
            if (!vendorStock.finalPrices) {
                vendorStock.finalPrices = Array(6).fill(null);
            }
            if (vendorStock.finalPrices.length <= oldIndex) {
                vendorStock.finalPrices = [...vendorStock.finalPrices, ...Array(6 - vendorStock.finalPrices.length).fill(null)];
            }
            vendorStock.finalPrices[oldIndex] = updatedVendorSegregate.finalPrice;
        }

        await vendorStock.save();

        // Recalculate aggregated totals
        const aggregation = await VendorSegregate.aggregate([
            { $match: { vendorStockId: vendorStock._id } },
            {
                $group: {
                    _id: "$vendorStockId",
                    finalTotalWeight: { $sum: "$totalWeight" },
                    totalFinalPrice: { $sum: "$finalPrice" },
                    finalTotalPriceStandard: { $sum: "$totalPriceStandard" },
                    finalTotalPriceFinal: { $sum: "$totalPriceFinal" }
                }
            }
        ]);

        if (aggregation.length > 0) {
            await VendorStock.findByIdAndUpdate(vendorStockId, {
                finalTotalWeight: aggregation[0].finalTotalWeight,
                totalFinalPrice: aggregation[0].totalFinalPrice,
                finalTotalPriceStandard: aggregation[0].finalTotalPriceStandard,
                finalTotalPriceFinal: aggregation[0].finalTotalPriceFinal
            });
        }

        res.status(200).json({ message: 'vendor Form updated successfully', updatedVendorSegregate });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating Vendor Form', details: error.message });
    }
};


// Delete a Vendor Entry and associated Vendor Form
exports.deleteVendorSegregate = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedVendorSegregate = await VendorSegregate.findByIdAndDelete(id);
        if (!deletedVendorSegregate) {
            return res.status(404).json({ error: 'Vendor Form not found' });
        }

        const vendorStockId = deletedVendorSegregate.vendorStockId;
        const vendorStock = await VendorStock.findById(vendorStockId);
        if (!vendorStock) {
            return res.status(404).json({ error: 'vendor Stock not found' });
        }

        const makhanaMapping = {
            "6 Sutta": 0,
            "5 Sutta": 1,
            "4 Sutta": 2,
            "3 Sutta": 3,
            "Other": 4,
            "Waste": 5
        };

        const makhana = deletedVendorSegregate.makhana;
        const index = makhanaMapping[makhana];
        if (index === undefined) {
            return res.status(400).json({ error: 'Invalid makhana value in deleted entry' });
        }

        // Reset corresponding totalWeight and finalPrice
        vendorStock[`totalWeight${index + 1}`] = null;
        if (vendorStock.finalPrices && vendorStock.finalPrices.length > index) {
            vendorStock.finalPrices[index] = null;
        }
        await vendorStock.save();

        // Recalculate aggregated totals
        const aggregation = await VendorSegregate.aggregate([
            { $match: { vendorStockId: vendorStock._id } },
            {
                $group: {
                    _id: "$vendorStockId",
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

        await VendorStock.findByIdAndUpdate(vendorStockId, updateData);

        res.status(200).json({ message: 'vendor Form deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting vendor Form', details: error.message });
    }
};