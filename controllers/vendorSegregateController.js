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

// Get all Cash Entries
exports.getAllVendorSegregate = async (req, res) => {
    try {
        const vendorEntries = await VendorSegregate.find();
        res.status(200).json(vendorEntries);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching Cash entries' });
    }
};

// Get Cash Form by Cash ID
// exports.getVendorSegregateByVendorId = async (req, res) => {
//     try {
//         const { vendorStockId } = req.params;
//         const vendorSegregate = await VendorSegregate.findOne({ vendorStockId }).populate('cashId');
//         if (!vendorSegregate) {
//             return res.status(404).json({ error: 'Cash Form not found' });
//         }
//         res.status(200).json(vendorSegregate);
//     } catch (error) {
//         res.status(500).json({ error: 'Error fetching Cash Form' });
//     }
// };

exports.getVendorSegregateByVendorId = async (req, res) => {
    try {
        const { vendorStockId } = req.params;

        // Fetch all cashStock records related to the given cashFormId
        const vendorSegregate = await VendorSegregate.find({ vendorStockId }).populate('vendorStockId');

        if (!vendorSegregate || vendorSegregate.length === 0) {
            return res.status(404).json({ error: 'No Cash Stock entries found for this Cash Form ID' });
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
        res.status(500).json({ error: 'Error fetching Cash Stock entries', details: error.message });
    }
};

// Update a Cash Form
exports.updateVendorSegregate = async (req, res) => {
    try {
        const { id } = req.params;

        // Retrieve the existing VendorSegregate document before update
        const existingVendorSegregate = await VendorSegregate.findById(id);
        if (!existingVendorSegregate) {
            return res.status(404).json({ error: 'Vendor Form not found' });
        }

        const vendorStockId = existingVendorSegregate.vendorStockId;
        const vendorStock = await VendorStock.findById(vendorStockId);
        if (!vendorStock) {
            return res.status(404).json({ error: 'vendor Stock not found' });
        }

        // Fetch all vendorSegregate entries for the vendorStock sorted by creation time
        const vendorSegregates = await VendorSegregate.find({ vendorStockId }).sort({ createdAt: 1 });

        // Determine the index of the current vendorSegregate entry
        const index = vendorSegregates.findIndex(cs => cs._id.equals(id));
        if (index === -1) {
            return res.status(404).json({ error: 'vendor Segregate not found in vendor Stock' });
        }

        // Validate the index to ensure it's within the allowed range (0-5)
        if (index < 0 || index >= 6) {
            return res.status(400).json({ error: 'Invalid vendor Segregate index' });
        }

        // Update the vendorSegregate with new data
        const updatedVendorSegregate = await VendorSegregate.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
        );

        // Determine which totalWeight field to update in VendorStock (totalWeight1 to totalWeight6)
        const totalWeightField = `totalWeight${index + 1}`;
        vendorStock[totalWeightField] = updatedVendorSegregate.totalWeight;

        // Update the finalPrices array if the finalPrice has changed
        const oldFinalPrice = existingVendorSegregate.finalPrice;
        const newFinalPrice = updatedVendorSegregate.finalPrice;
        if (oldFinalPrice !== newFinalPrice) {
            if (vendorStock.finalPrices.length > index) {
                vendorStock.finalPrices[index] = newFinalPrice;
            } else {
                return res.status(500).json({ error: 'Final prices array inconsistency detected' });
            }
        }

        // Save the updated vendorStock
        await vendorStock.save();

        // Recalculate aggregated totals using all vendorSegregate entries
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

        // Update vendorStock with the new aggregated totals
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
        res.status(500).json({ error: 'Error updating vendor Form', details: error.message });
    }
};


// Delete a Cash Entry and associated Cash Form
exports.deleteVendorSegregate = async (req, res) => {
    try {
        const { id } = req.params; // Use the document's unique _id

        const deletedVendorSegregate = await VendorSegregate.findByIdAndDelete(id);
        if (!deletedVendorSegregate) {
            return res.status(404).json({ error: 'Cash Form not found' });
        }

        res.status(200).json({ message: 'Cash Form deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting Cash Form' });
    }
};

