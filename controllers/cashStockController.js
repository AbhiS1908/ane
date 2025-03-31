const CashStock = require('../models/cashStockModel');
const CashForm = require('../models/cashFormModel');
const CashSingleStock = require('../models/cashSingleStockModel');

// Create a Cash Form linked to Cash ID
exports.createCashStock = async (req, res) => {
    try {
        const { cashFormId, product, particular, hsn, quantity, rate, pricePerKgBag, gst, amount, status, amountPaid, amountLeft, profit, weight } = req.body;
        
        const cash = await CashForm.findById(cashFormId);
        if (!cash) {
            return res.status(404).json({ error: 'Cash not found' });
        }

        const existingCashStocks = await CashStock.find({ cashFormId });
        const totalEntries = existingCashStocks.length + 1; // Include the new entry

        // Divide the transportationCost equally
        const dividedTransportationCost = cash.transportationCost / totalEntries;

        // Update existing CashStock entries with the new divided cost
        if (existingCashStocks.length > 0) {
            await CashStock.updateMany(
                { cashFormId },
                { transportationCost: dividedTransportationCost }
            );
        }

        const cashStock = new CashStock({
            cashFormId,
            cashName: cash.cashName,
            particular, 
            hsn,
            quantity,
            rate,
            pricePerKgBag,
            gst,
            amount,
            amountPaid,
            amountLeft,
            status,
            profit,
            weight,
            product,
            poNo: cash.poNo,
            transportationCost: dividedTransportationCost, // Add this line
            eDate: cash.eDate
           
        });

        await cashStock.save();
        res.status(201).json({ message: 'Cash Form created successfully', cashStock });
    } catch (error) {
        res.status(500).json({ error: 'Error creating Cash Form' });
    }
};

// Get all Cash Entries
exports.getAllCashStock = async (req, res) => {
    try {
        const cashEntries = await CashStock.find();
        res.status(200).json(cashEntries);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching Cash entries' });
    }
};

exports.getCashStockById = async (req, res) => {
    try {
        const { id } = req.params;
        const cashStock = await CashStock.findById(id);
        
        if (!cashStock) {
            return res.status(404).json({ error: 'CashStock not found' });
        }

        res.status(200).json(cashStock);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching CashStock' });
    }
};

// Get Cash Form by Cash ID
// Get all Cash Stock entries linked to a specific Cash Form ID
exports.getCashStockByCashId = async (req, res) => {
    try {
        const { cashFormId } = req.params;

        // Fetch all cashStock records related to the given cashFormId
        const cashStocks = await CashStock.find({ cashFormId }).populate('cashFormId');

        if (!cashStocks || cashStocks.length === 0) {
            return res.status(404).json({ error: 'No Cash Stock entries found for this Cash Form ID' });
        }

        // Map the data to extract only required fields
        const formattedData = cashStocks.map(stock => ({
            _id: stock._id,
            cashFormId: stock.cashFormId._id, // Convert object to string ID
            particular: stock.particular,
            hsn: stock.hsn,
            quantity: stock.quantity,
            rate: stock.rate,
            gst: stock.gst,
            weight: stock.weight,
            amount: stock.amount,
            status: stock.status,
            pricePerKgBag: stock.pricePerKgBag,
            amountPaid: stock.amountPaid,
            amountLeft: stock.amountLeft,
            __v: stock.__v,
            actualValue: stock.actualValue,
            totalBagWeight: stock.totalBagWeight,
            totalPurchaseRate: stock.totalPurchaseRate,
            totalValue: stock.totalValue,
            valueDiff: stock.valueDiff,
            profit: stock.profit,
            finalTotalWeight: stock.finalTotalWeight,
            totalFinalPrice: stock.totalFinalPrice,
            finalTotalPriceStandard: stock.finalTotalPriceStandard,
            finalTotalPriceFinal: stock.finalTotalPriceFinal,
            finalPrices: stock.finalPrices,
            product: stock.product,
            totalWeight1: stock.totalWeight1,
            totalWeight2: stock.totalWeight2,
            totalWeight3: stock.totalWeight3,
            totalWeight4: stock.totalWeight4,
            totalWeight5: stock.totalWeight5,
            totalWeight6: stock.totalWeight6,
            poNo: stock.poNo,
            transportationCost: stock.transportationCost,
            eDate: stock.eDate
            
        }));

        res.status(200).json(formattedData);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching Cash Stock entries', details: error.message });
    }
};



// Update a Cash Form
exports.updateCashStock = async (req, res) => {
    try {
        const { id } = req.params; // Use the document's unique _id

        const updatedCashForm = await CashStock.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedCashForm) {
            return res.status(404).json({ error: 'Cash Form not found' });
        }

        res.status(200).json({ message: 'Cash Form updated successfully', updatedCashForm });
    } catch (error) {
        res.status(500).json({ error: 'Error updating Cash Form' });
    }
};


// Delete a Cash Entry and associated Cash Form
exports.deleteCashStock = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCashStock = await CashStock.findByIdAndDelete(id);

        if (!deletedCashStock) {
            return res.status(404).json({ error: 'CashStock not found' });
        }

        // Recalculate transportationCost for remaining entries
        const cashForm = await CashForm.findById(deletedCashStock.cashFormId);
        const remainingStocks = await CashStock.find({ cashFormId: deletedCashStock.cashFormId });

        if (remainingStocks.length > 0 && cashForm) {
            const dividedCost = cashForm.transportationCost / remainingStocks.length;
            await CashStock.updateMany(
                { cashFormId: deletedCashStock.cashFormId },
                { transportationCost: dividedCost }
            );
        }

        res.status(200).json({ message: 'CashStock deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting CashStock', details: error.message });
    }
};

exports.calculateTotalsForCashStock = async (req, res) => {
    try {
        const { cashStockId } = req.params;
        
        // Find all cashSingleStock entries related to this cashStockId
        const cashSingleStocks = await CashSingleStock.find({ cashStockId });
        if (!cashSingleStocks.length) {
            return res.status(404).json({ error: 'No stock entries found for this Cash Stock ID' });
        }

        // Calculate totals
        const totals = cashSingleStocks.reduce((acc, stock) => {
            acc.totalBagWeight += parseFloat(stock.bagWeight) || 0;
            acc.totalPurchaseRate += parseFloat(stock.purchaseRate) || 0;
            acc.totalValue += stock.totalValue || 0;
            acc.actualValue += stock.actualValue || 0;
            acc.valueDiff += stock.valueDiff || 0;
            return acc;
        }, { totalBagWeight: 0, totalPurchaseRate: 0, totalValue: 0, actualValue: 0, valueDiff: 0 });

        // Update the CashStock document with calculated totals
        const updatedCashStock = await CashStock.findByIdAndUpdate(
            cashStockId,
            { 
                totalBagWeight: totals.totalBagWeight,
                totalPurchaseRate: totals.totalPurchaseRate,
                totalValue: totals.totalValue,
                actualValue: totals.actualValue,
                valueDiff: totals.valueDiff
            },
            { new: true } // Return updated document
        );

        if (!updatedCashStock) {
            return res.status(404).json({ error: 'Cash Stock not found' });
        }

        res.status(200).json({ message: 'Totals calculated and updated successfully', updatedCashStock });
    } catch (error) {
        res.status(500).json({ error: 'Error calculating and updating totals', details: error.message });
    }
};

