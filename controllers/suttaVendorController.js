const SuttaVendor = require('../models/suttaVendorModel');
const VendorStock = require('../models/vendorStockModel');

// Create a new SuttaVendor entry
exports.createVendorSingleStock = async (req, res) => {
    try {
        const { vendorStockId, quantity, ratePerKg, count } = req.body;

        const vendorStock = await VendorStock.findById(vendorStockId);

        if (!vendorStock) {
            return res.status(404).json({ error: 'vendorStock not found' });
        }

        const vendorSingleStock = new SuttaVendor({
            vendorStockId,
            quantity,
            ratePerKg: vendorStock.pricePerKgBag,
            count
        });

        await vendorSingleStock.save();
        res.status(201).json({ message: 'Suttavendor created successfully', vendorSingleStock });
    } catch (error) {
        res.status(500).json({ error: 'Error creating Suttavendor', details: error.message });
    }
};

// Get all Suttavendor entries for a specific VendorStockId
exports.getVendorSingleStocksByVendorStockId = async (req, res) => {
    try {
        const { vendorStockId } = req.params;

        const vendorSingleStocks = await SuttaVendor.find({ vendorStockId });

        if (!vendorSingleStocks || vendorSingleStocks.length === 0) {
            return res.status(404).json({ error: 'No Suttavendor entries found for this vendorStock ID' });
        }

        res.status(200).json(vendorSingleStocks);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching Suttavendor entries', details: error.message });
    }
};

// Update a Suttavendor entry
exports.updateVendorSingleStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, ratePerKg, count } = req.body;
        const totalCost = quantity * ratePerKg * count;

        const updatedVendorSingleStock = await SuttaVendor.findByIdAndUpdate(
            id,
            { quantity, ratePerKg, count, totalCost },
            { new: true }
        );

        if (!updatedVendorSingleStock) {
            return res.status(404).json({ error: 'SuttaVendor not found' });
        }

        res.status(200).json({ message: 'SuttaVendor updated successfully', updatedVendorSingleStock });
    } catch (error) {
        res.status(500).json({ error: 'Error updating SuttaVendor', details: error.message });
    }
};

// Delete a SuttaVendor entry
exports.deleteVendorSingleStock = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedVendorSingleStock = await SuttaVendor.findByIdAndDelete(id);

        if (!deletedVendorSingleStock) {
            return res.status(404).json({ error: 'SuttaVendor not found' });
        }

        res.status(200).json({ message: 'SuttaVendor deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting SuttaVendor', details: error.message });
    }
};

exports.stockOut = async (req, res) => {
    try {
        const { _id } = req.params; // Use id from URL params

        // Find the SuttaVendor entry
        const suttaVendor = await SuttaVendor.findById(_id);

        if (!suttaVendor) {
            return res.status(404).json({ error: 'SuttaVendor not found' });
        }

        // Calculate total quantity to subtract
        const totalQuantityToSubtract = suttaVendor.quantity * suttaVendor.count;

        // Find related VendorStock to update stock
        const vendorStock = await VendorStock.findById(suttaVendor.vendorStockId);
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

        // Mark Suttavendor as stocked out (optional: you can add a status field)
        suttaVendor.quantity = 0; // Set to 0 since stock has been deducted
        await suttaVendor.save();

        res.status(200).json({
            message: 'Stock out successful',
            updatedSuttaVendor: suttaVendor,
            updatedVendorStock: vendorStock
        });
    } catch (error) {
        res.status(500).json({ error: 'Error during stock out', details: error.message });
    }
};

