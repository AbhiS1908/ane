const SutaCash = require('../models/sutaCashModel');
const CashStock = require('../models/cashStockModel');

// Create a new SutaCash entry
exports.createCashSingleStock = async (req, res) => {
    try {
        const { cashStockId, quantity, ratePerKg, count } = req.body;

        const cashStock = await CashStock.findById(cashStockId);

        if (!cashStock) {
            return res.status(404).json({ error: 'CashStock not found' });
        }

        const cashSingleStock = new SutaCash({
            cashStockId,
            quantity,
            ratePerKg: cashStock.pricePerKgBag,
            count
        });

        await cashSingleStock.save();
        res.status(201).json({ message: 'SutaCash created successfully', cashSingleStock });
    } catch (error) {
        res.status(500).json({ error: 'Error creating SutaCash', details: error.message });
    }
};

// Get all SutaCash entries for a specific cashStockId
exports.getCashSingleStocksByCashStockId = async (req, res) => {
    try {
        const { cashStockId } = req.params;

        const cashSingleStocks = await SutaCash.find({ cashStockId });

        if (!cashSingleStocks || cashSingleStocks.length === 0) {
            return res.status(404).json({ error: 'No SutaCash entries found for this CashStock ID' });
        }

        res.status(200).json(cashSingleStocks);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching SutaCash entries', details: error.message });
    }
};

// Update a SutaCash entry
exports.updateCashSingleStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, ratePerKg, count } = req.body;
        const totalCost = quantity * ratePerKg * count;

        const updatedCashSingleStock = await SutaCash.findByIdAndUpdate(
            id,
            { quantity, ratePerKg, count, totalCost },
            { new: true }
        );

        if (!updatedCashSingleStock) {
            return res.status(404).json({ error: 'SutaCash not found' });
        }

        res.status(200).json({ message: 'SutaCash updated successfully', updatedCashSingleStock });
    } catch (error) {
        res.status(500).json({ error: 'Error updating SutaCash', details: error.message });
    }
};

// Delete a SutaCash entry
exports.deleteCashSingleStock = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedCashSingleStock = await SutaCash.findByIdAndDelete(id);

        if (!deletedCashSingleStock) {
            return res.status(404).json({ error: 'SutaCash not found' });
        }

        res.status(200).json({ message: 'SutaCash deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting SutaCash', details: error.message });
    }
};

exports.stockOut = async (req, res) => {
    try {
        const { _id } = req.params; // Use id from URL params

        // Find the SutaCash entry
        const sutaCash = await SutaCash.findById(_id);

        if (!sutaCash) {
            return res.status(404).json({ error: 'SutaCash not found' });
        }

        // Calculate total quantity to subtract
        const totalQuantityToSubtract = sutaCash.quantity * sutaCash.count;

        // Find related CashStock to update stock
        const cashStock = await CashStock.findById(sutaCash.cashStockId);
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

        // Mark SutaCash as stocked out (optional: you can add a status field)
        sutaCash.quantity = 0; // Set to 0 since stock has been deducted
        await sutaCash.save();

        res.status(200).json({
            message: 'Stock out successful',
            updatedSutaCash: sutaCash,
            updatedCashStock: cashStock
        });
    } catch (error) {
        res.status(500).json({ error: 'Error during stock out', details: error.message });
    }
};

