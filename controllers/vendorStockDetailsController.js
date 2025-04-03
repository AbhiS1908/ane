const VendorStock = require('../models/vendorStockModel');
const VendorStockDetails = require('../models/vendorStockDetailsModel');

// Create new stock details
exports.createStockDetails = async (req, res) => {
    try {
        const { vendorStockId, totalMaterialCost, rapperCost, labourCost, adminExpense, totalMaterialWeight, plasticWeight, packetCount } = req.body;
const vendorStock = await VendorStock.findById(vendorStockId);
        if (!vendorStock) {
            return res.status(404).json({ message: 'Cash Stock not found' });
        }
        const newStockDetails = new VendorStockDetails({
            vendorStockId,
            totalMaterialCost,
            rapperCost,
            labourCost,
            adminExpense,
            totalMaterialWeight,
            plasticWeight,
            packetCount,
            finalPrices: vendorStock.finalPrices, // Pass the finalPrices from CashStock

        });

        await newStockDetails.save();
        res.status(201).json({ message: 'Stock details created successfully', data: newStockDetails });
    } catch (error) {
        res.status(500).json({ message: 'Error creating stock details', error });
    }
};

// Get stock details
exports.getStockDetails = async (req, res) => {
    try {
        const stockDetails = await VendorStockDetails.findById(req.params.id).populate('vendorStockId');
        if (!stockDetails) return res.status(404).json({ message: 'Stock details not found' });
        res.json(stockDetails);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stock details', error });
    }
};

exports.getStockDetailsByVendorStockId = async (req, res) => {
    try {
        const { vendorStockId } = req.params;

        // Fetch all vendorStock records related to the given vendorFormId
        const vendorSegregate = await VendorStockDetails.find({ vendorStockId }).populate('vendorStockId');

        if (!vendorSegregate || vendorSegregate.length === 0) {
            return res.status(404).json({ error: 'No vendor Stock entries found for this vendor Form ID' });
        }

        // Map the data to extract only required fields
        const formattedData = vendorSegregate.map(stock => ({
            _id: stock._id,
            vendorStockId: stock.vendorStockId._id,
            totalMaterialCost: stock.totalMaterialCost,
            rapperCost: stock.rapperCost, 
            labourCost: stock.labourCost,
            adminExpense: stock.adminExpense,
            totalMaterialWeight: stock.totalMaterialWeight,
            plasticWeight: stock.plasticWeight,
            packetCount: stock.packetCount,
            finalCost: stock.finalCost,
            totalWeight: stock.totalWeight,
            totalCalculatedCost: stock.totalCalculatedCost,
            totalCalculatedWeight: stock.totalCalculatedWeight,
            finalPrices: stock.finalPrices,
            weight1: stock.weight1,
            weight2: stock.weight2,
            weight3: stock.weight3,
            weight4: stock.weight4,
            weight5: stock.weight5,
            weight6: stock.weight6,
            finalWeight1: stock.finalWeight1,
            finalWeight2: stock.finalWeight2,
            finalWeight3: stock.finalWeight3,
            finalWeight4: stock.finalWeight4,
            finalWeight5: stock.finalWeight5,
            finalWeight6: stock.finalWeight6

        }));

        res.status(200).json(formattedData);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching vendor Stock entries', details: error.message });
    }
};


// Update stock details
exports.updateStockDetails = async (req, res) => {
    try {
        const updatedDetails = await VendorStockDetails.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!updatedDetails) return res.status(404).json({ message: 'Stock details not found' });

        // Recalculate auto-generated fields
        updatedDetails.finalCost = updatedDetails.totalMaterialCost + updatedDetails.rapperCost + updatedDetails.labourCost + updatedDetails.adminExpense;
        updatedDetails.totalWeight = updatedDetails.totalMaterialWeight + updatedDetails.plasticWeight;
        updatedDetails.totalCalculatedCost = updatedDetails.totalWeight * updatedDetails.packetCount;
        updatedDetails.totalCalculatedWeight = updatedDetails.totalWeight * updatedDetails.packetCount;
        updatedDetails.finalWeight1 = (updatedDetails.weight1 || 0) * updatedDetails.packetCount;
        updatedDetails.finalWeight2 = (updatedDetails.weight2 || 0) * updatedDetails.packetCount;
        updatedDetails.finalWeight3 = (updatedDetails.weight3 || 0) * updatedDetails.packetCount;
        updatedDetails.finalWeight4 = (updatedDetails.weight4 || 0) * updatedDetails.packetCount;
        updatedDetails.finalWeight5 = (updatedDetails.weight5 || 0) * updatedDetails.packetCount;
        updatedDetails.finalWeight6 = (updatedDetails.weight6 || 0) * updatedDetails.packetCount;


        await updatedDetails.save();
        res.json({ message: 'Stock details updated successfully', data: updatedDetails });
    } catch (error) {
        res.status(500).json({ message: 'Error updating stock details', error });
    }
};

// "Packets Out" functionality
exports.packetsOut = async (req, res) => {
    try {
        const stockDetails = await VendorStockDetails.findById(req.params.id);
        if (!stockDetails) return res.status(404).json({ message: 'Stock details not found' });

        // Find related vendorStock record
        const vendorStock = await VendorStock.findById(stockDetails.vendorStockId);
        if (!vendorStock) return res.status(404).json({ message: 'vendor stock not found' });

        // Deduct values from vendorStock
        vendorStock.finalTotalWeight -= stockDetails.totalCalculatedWeight;

        await vendorStock.save();
        res.json({ message: 'Packets out updated successfully', vendorStock });
    } catch (error) {
        res.status(500).json({ message: 'Error processing packets out', error });
    }
};

exports.packetsOutProduct = async (req, res) => {
    try {
        const stockDetails = await VendorStockDetails.findById(req.params.id);
        if (!stockDetails) return res.status(404).json({ message: 'Stock details not found' });

        // Find related vendorStock record
        const vendorStock = await VendorStock.findById(stockDetails.vendorStockId);
        if (!vendorStock) return res.status(404).json({ message: 'vendor stock not found' });

        // Deduct values from vendorStock
        vendorStock.quantity -= stockDetails.totalCalculatedWeight;
        vendorStock.totalWeight1 -= stockDetails.finalWeight1;
        vendorStock.totalWeight2 -= stockDetails.finalWeight2;
        vendorStock.totalWeight3 -= stockDetails.finalWeight3;
        vendorStock.totalWeight4 -= stockDetails.finalWeight4;
        vendorStock.totalWeight5 -= stockDetails.finalWeight5;
        vendorStock.totalWeight6 -= stockDetails.finalWeight6;

        await vendorStock.save();
        res.json({ message: 'Packets out updated successfully', vendorStock });
    } catch (error) {
        res.status(500).json({ message: 'Error processing packets out', error });
    }
};
