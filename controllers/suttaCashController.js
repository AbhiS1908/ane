const SuttaCash = require('../models/suttaCashModel');
const CashStock = require('../models/cashStockModel');

// Create a new SuttaCash entry
exports.createCashSingleStock = async (req, res) => {
    try {
        const { cashStockId, quantity, ratePerKg, count } = req.body;

        const cashStock = await CashStock.findById(cashStockId);

        if (!cashStock) {
            return res.status(404).json({ error: 'CashStock not found' });
        }

        const cashSingleStock = new SuttaCash({
            cashStockId,
            quantity,
            ratePerKg: cashStock.pricePerKgBag,
            count
        });

        await cashSingleStock.save();
        res.status(201).json({ message: 'SuttaCash created successfully', cashSingleStock });
    } catch (error) {
        res.status(500).json({ error: 'Error creating SuttaCash', details: error.message });
    }
};

// Get all SuttaCash entries for a specific cashStockId
exports.getCashSingleStocksByCashStockId = async (req, res) => {
    try {
        const { cashStockId } = req.params;

        const cashSingleStocks = await SuttaCash.find({ cashStockId });

        if (!cashSingleStocks || cashSingleStocks.length === 0) {
            return res.status(404).json({ error: 'No SuttaCash entries found for this CashStock ID' });
        }

        res.status(200).json(cashSingleStocks);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching SuttaCash entries', details: error.message });
    }
};

// Update a SuttaCash entry
exports.updateCashSingleStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, ratePerKg, count } = req.body;
        const totalCost = quantity * ratePerKg * count;

        const updatedCashSingleStock = await SuttaCash.findByIdAndUpdate(
            id,
            { quantity, ratePerKg, count, totalCost },
            { new: true }
        );

        if (!updatedCashSingleStock) {
            return res.status(404).json({ error: 'SuttaCash not found' });
        }

        res.status(200).json({ message: 'SuttaCash updated successfully', updatedCashSingleStock });
    } catch (error) {
        res.status(500).json({ error: 'Error updating SuttaCash', details: error.message });
    }
};

// Delete a SuttaCash entry
exports.deleteCashSingleStock = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedCashSingleStock = await SuttaCash.findByIdAndDelete(id);

        if (!deletedCashSingleStock) {
            return res.status(404).json({ error: 'SuttaCash not found' });
        }

        res.status(200).json({ message: 'SuttaCash deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting SuttaCash', details: error.message });
    }
};

exports.stockOut = async (req, res) => {
    try {
        const { _id } = req.params; // Use id from URL params

        // Find the SuttaCash entry
        const suttaCash = await SuttaCash.findById(_id);

        if (!suttaCash) {
            return res.status(404).json({ error: 'SuttaCash not found' });
        }

        // Calculate total quantity to subtract
        const totalQuantityToSubtract = suttaCash.quantity * suttaCash.count;

        // Find related CashStock to update stock
        const cashStock = await CashStock.findById(suttaCash.cashStockId);
        if (!cashStock) {
            return res.status(404).json({ error: 'Related CashStock not found' });
        }

        // Check if enough stock is available
        if (cashStock.quantity < totalQuantityToSubtract) {
            return res.status(400).json({ error: 'Insufficient quantity in CashStock' });
        }

        // Subtract stock from CashStock
        cashStock.quantity -= totalQuantityToSubtract;
        await cashStock.save();

        // Mark SuttaCash as stocked out (optional: you can add a status field)
        suttaCash.quantity = 0; // Set to 0 since stock has been deducted
        await suttaCash.save();

        res.status(200).json({
            message: 'Stock out successful',
            updatedSuttaCash: suttaCash,
            updatedCashStock: cashStock
        });
    } catch (error) {
        res.status(500).json({ error: 'Error during stock out', details: error.message });
    }
};

