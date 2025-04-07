const SutaFarmer = require('../models/sutaFarmerModel');
const FarmerStock = require('../models/farmerStockModel');

// Create a new SutaFarmer entry
exports.createFarmerSingleStock = async (req, res) => {
    try {
        const { farmerStockId, quantity, ratePerKg, count } = req.body;

        const farmerStock = await FarmerStock.findById(farmerStockId);

        if (!farmerStock) {
            return res.status(404).json({ error: 'farmerStock not found' });
        }

        const farmerSingleStock = new SutaFarmer({
            farmerStockId,
            quantity,
            ratePerKg: farmerStock.pricePerKgBag,
            count
        });

        await farmerSingleStock.save();
        res.status(201).json({ message: 'SutaFarmer created successfully', farmerSingleStock });
    } catch (error) {
        res.status(500).json({ error: 'Error creating SutaFarmer', details: error.message });
    }
};

// Get all SutaFarmer entries for a specific farmerStockId
exports.getFarmerSingleStocksByFarmerStockId = async (req, res) => {
    try {
        const { farmerStockId } = req.params;

        const farmerSingleStocks = await SutaFarmer.find({ farmerStockId });

        if (!farmerSingleStocks || farmerSingleStocks.length === 0) {
            return res.status(404).json({ error: 'No SutaFarmer entries found for this farmerStock ID' });
        }

        res.status(200).json(farmerSingleStocks);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching SutaFarmer entries', details: error.message });
    }
};

// Update a SutaFarmer entry
exports.updateFarmerSingleStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, ratePerKg, count } = req.body;
        const totalCost = quantity * ratePerKg * count;

        const updatedFarmerSingleStock = await SutaFarmer.findByIdAndUpdate(
            id,
            { quantity, ratePerKg, count, totalCost },
            { new: true }
        );

        if (!updatedFarmerSingleStock) {
            return res.status(404).json({ error: 'SutaFarmer not found' });
        }

        res.status(200).json({ message: 'SutaFarmer updated successfully', updatedFarmerSingleStock });
    } catch (error) {
        res.status(500).json({ error: 'Error updating SutaFarmer', details: error.message });
    }
};

// Delete a SutaFarmer entry
exports.deleteFarmerSingleStock = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedFarmerSingleStock = await SutaFarmer.findByIdAndDelete(id);

        if (!deletedFarmerSingleStock) {
            return res.status(404).json({ error: 'SutaFarmer not found' });
        }

        res.status(200).json({ message: 'SutaFarmer deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting SutaFarmer', details: error.message });
    }
};

exports.stockOut = async (req, res) => {
    try {
        const { _id } = req.params; // Use id from URL params

        // Find the SutaFarmer entry
        const sutaFarmer = await SutaFarmer.findById(_id);

        if (!sutaFarmer) {
            return res.status(404).json({ error: 'sutaFarmer not found' });
        }

        // Calculate total quantity to subtract
        const totalQuantityToSubtract = sutaFarmer.quantity * sutaFarmer.count;

        // Find related FarmerStock to update stock
        const farmerStock = await FarmerStock.findById(sutaFarmer.farmerStockId);
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

        // Mark sutaFarmer as stocked out (optional: you can add a status field)
        sutaFarmer.quantity = 0; // Set to 0 since stock has been deducted
        await sutaFarmer.save();

        res.status(200).json({
            message: 'Stock out successful',
            updatedSutaFarmer: sutaFarmer,
            updatedFarmerStock: farmerStock
        });
    } catch (error) {
        res.status(500).json({ error: 'Error during stock out', details: error.message });
    }
};

