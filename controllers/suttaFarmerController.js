const SuttaFarmer = require('../models/suttaFarmerModel');
const FarmerStock = require('../models/farmerStockModel');

// Create a new Suttafarmer entry
exports.createFarmerSingleStock = async (req, res) => {
    try {
        const { farmerStockId, quantity, ratePerKg, count } = req.body;

        const farmerStock = await FarmerStock.findById(farmerStockId);

        if (!farmerStock) {
            return res.status(404).json({ error: 'farmerStock not found' });
        }

        const farmerSingleStock = new SuttaFarmer({
            farmerStockId,
            quantity,
            ratePerKg: farmerStock.pricePerKgBag,
            count
        });

        await farmerSingleStock.save();
        res.status(201).json({ message: 'Suttafarmer created successfully', farmerSingleStock });
    } catch (error) {
        res.status(500).json({ error: 'Error creating Suttafarmer', details: error.message });
    }
};

// Get all Suttafarmer entries for a specific farmerStockId
exports.getFarmerSingleStocksByFarmerStockId = async (req, res) => {
    try {
        const { farmerStockId } = req.params;

        const farmerSingleStocks = await SuttaFarmer.find({ farmerStockId });

        if (!farmerSingleStocks || farmerSingleStocks.length === 0) {
            return res.status(404).json({ error: 'No Suttafarmer entries found for this farmerStock ID' });
        }

        res.status(200).json(farmerSingleStocks);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching Suttafarmer entries', details: error.message });
    }
};

// Update a Suttafarmer entry
exports.updateFarmerSingleStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, ratePerKg, count } = req.body;
        const totalCost = quantity * ratePerKg * count;

        const updatedFarmerSingleStock = await SuttaFarmer.findByIdAndUpdate(
            id,
            { quantity, ratePerKg, count, totalCost },
            { new: true }
        );

        if (!updatedFarmerSingleStock) {
            return res.status(404).json({ error: 'Suttafarmer not found' });
        }

        res.status(200).json({ message: 'Suttafarmer updated successfully', updatedFarmerSingleStock });
    } catch (error) {
        res.status(500).json({ error: 'Error updating Suttafarmer', details: error.message });
    }
};

// Delete a Suttafarmer entry
exports.deleteFarmerSingleStock = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedFarmerSingleStock = await SuttaFarmer.findByIdAndDelete(id);

        if (!deletedFarmerSingleStock) {
            return res.status(404).json({ error: 'SuttaFarmer not found' });
        }

        res.status(200).json({ message: 'SuttaFarmer deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting SuttaFarmer', details: error.message });
    }
};

exports.stockOut = async (req, res) => {
    try {
        const { _id } = req.params; // Use id from URL params

        // Find the SuttaFarmer entry
        const suttaFarmer = await SuttaFarmer.findById(_id);

        if (!suttaFarmer) {
            return res.status(404).json({ error: 'SuttaFarmer not found' });
        }

        // Calculate total quantity to subtract
        const totalQuantityToSubtract = suttaFarmer.quantity * suttaFarmer.count;

        // Find related FarmerStock to update stock
        const farmerStock = await FarmerStock.findById(suttaFarmer.farmerStockId);
        if (!farmerStock) {
            return res.status(404).json({ error: 'Related farmerStock not found' });
        }

        // Check if enough stock is available
        if (farmerStock.quantity < totalQuantityToSubtract) {
            return res.status(400).json({ error: 'Insufficient quantity in farmerStock' });
        }

        // Subtract stock from farmerStock
        farmerStock.quantity -= totalQuantityToSubtract;
        await farmerStock.save();

        // Mark Suttafarmer as stocked out (optional: you can add a status field)
        suttaFarmer.quantity = 0; // Set to 0 since stock has been deducted
        await suttaFarmer.save();

        res.status(200).json({
            message: 'Stock out successful',
            updatedSuttaFarmer: suttaFarmer,
            updatedFarmerStock: farmerStock
        });
    } catch (error) {
        res.status(500).json({ error: 'Error during stock out', details: error.message });
    }
};

