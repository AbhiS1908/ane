const SutaVendor = require('../models/sutaVendorModel');
const VendorStock = require('../models/vendorStockModel');

// Create a new SutaVendor entry
exports.createVendorSingleStock = async (req, res) => {
    try {
        const { vendorStockId, quantity, ratePerKg, count } = req.body;

        const vendorStock = await VendorStock.findById(vendorStockId);

        if (!vendorStock) {
            return res.status(404).json({ error: 'vendorStock not found' });
        }

        const vendorSingleStock = new SutaVendor({
            vendorStockId,
            quantity,
            ratePerKg: vendorStock.pricePerKgBag,
            count
        });

        await vendorSingleStock.save();
        res.status(201).json({ message: 'SutaVendor created successfully', vendorSingleStock });
    } catch (error) {
        res.status(500).json({ error: 'Error creating SutaVendor', details: error.message });
    }
};

// Get all SutaVendor entries for a specific VendorStockId
exports.getVendorSingleStocksByVendorStockId = async (req, res) => {
    try {
        const { vendorStockId } = req.params;

        const vendorSingleStocks = await SutaVendor.find({ vendorStockId });

        if (!vendorSingleStocks || vendorSingleStocks.length === 0) {
            return res.status(404).json({ error: 'No SutaVendor entries found for this vendorStock ID' });
        }

        res.status(200).json(vendorSingleStocks);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching SutaVendor entries', details: error.message });
    }
};

// Update a SutaVendor entry
exports.updateVendorSingleStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, ratePerKg, count } = req.body;
        const totalCost = quantity * ratePerKg * count;

        const updatedVendorSingleStock = await SutaVendor.findByIdAndUpdate(
            id,
            { quantity, ratePerKg, count, totalCost },
            { new: true }
        );

        if (!updatedVendorSingleStock) {
            return res.status(404).json({ error: 'SutaVendor not found' });
        }

        res.status(200).json({ message: 'SutaVendor updated successfully', updatedVendorSingleStock });
    } catch (error) {
        res.status(500).json({ error: 'Error updating SutaVendor', details: error.message });
    }
};

// Delete a SutaVendor entry
exports.deleteVendorSingleStock = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedVendorSingleStock = await SutaVendor.findByIdAndDelete(id);

        if (!deletedVendorSingleStock) {
            return res.status(404).json({ error: 'SutaVendor not found' });
        }

        res.status(200).json({ message: 'SutaVendor deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting SutaVendor', details: error.message });
    }
};

exports.stockOut = async (req, res) => {
    try {
        const { _id } = req.params; // Use id from URL params

        // Find the SutaVendor entry
        const sutaVendor = await SutaVendor.findById(_id);

        if (!sutaVendor) {
            return res.status(404).json({ error: 'sutaVendor not found' });
        }

        // Calculate total quantity to subtract
        const totalQuantityToSubtract = sutaVendor.quantity * sutaVendor.count;

        // Find related VendorStock to update stock
        const vendorStock = await VendorStock.findById(sutaVendor.vendorStockId);
        if (!vendorStock) {
            return res.status(404).json({ error: 'Related vendorStock not found' });
        }

        // Check if enough stock is available
        if (vendorStock.quantity < totalQuantityToSubtract) {
            return res.status(400).json({ error: 'Insufficient quantity in vendorStock' });
        }

        // Subtract stock from vendorStock
        vendorStock.quantity -= totalQuantityToSubtract;
        await vendorStock.save();

        // Mark sutaVendor as stocked out (optional: you can add a status field)
        sutaVendor.quantity = 0; // Set to 0 since stock has been deducted
        await sutaVendor.save();

        res.status(200).json({
            message: 'Stock out successful',
            updatedSutaVendor: sutaVendor,
            updatedVendorStock: vendorStock
        });
    } catch (error) {
        res.status(500).json({ error: 'Error during stock out', details: error.message });
    }
};

