const VendorStock = require('../models/vendorStockModel');
const VendorForm = require('../models/vendorFormModel');
const VendorSingleStock = require('../models/vendorSingleStockModel');

// Create a vendor Form linked to vendor ID
exports.createVendorStock = async (req, res) => {
    try {
        const { vendorFormId, product, particular, hsn, quantity, rate, pricePerKgBag, gst, amount, status, amountPaid, amountLeft, profit, weight } = req.body;
        
        const vendor = await VendorForm.findById(vendorFormId);
        if (!vendor) {
            return res.status(404).json({ error: 'vendor not found' });
        }

        const existingVendorStocks = await VendorStock.find({ vendorFormId });
                const totalEntries = existingVendorStocks.length + 1; // Include the new entry
        
                // Divide the transportationCost equally
                const dividedTransportationCost = vendor.transportationCost / totalEntries;
        
                // Update existing vendorStock entries with the new divided cost
                if (existingVendorStocks.length > 0) {
                    await VendorStock.updateMany(
                        { vendorFormId },
                        { transportationCost: dividedTransportationCost }
                    );
                }

        const vendorStock = new VendorStock({
            vendorFormId,
            vendorName: vendor.vendorName,
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
            product: vendor.product,
            poNo: vendor.poNo,
            transportationCost: dividedTransportationCost // Add this line

           
        });

        await vendorStock.save();
        res.status(201).json({ message: 'vendor Form created successfully', vendorStock });
    } catch (error) {
        res.status(500).json({ error: 'Error creating vendor Form' });
    }
};

// Get all vendor Entries
exports.getAllVendorStock = async (req, res) => {
    try {
        const vendorEntries = await VendorStock.find();
        res.status(200).json(vendorEntries);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching vendor entries' });
    }
};

exports.getVendorStockById = async (req, res) => {
    try {
        const { id } = req.params;
        const vendorStock = await VendorStock.findById(id);
        
        if (!vendorStock) {
            return res.status(404).json({ error: 'vendorStock not found' });
        }

        res.status(200).json(vendorStock);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching vendorStock' });
    }
};

// Get vendor Form by vendor ID
exports.getVendorStockByVendorId = async (req, res) => {
    try {
        const { vendorFormId } = req.params;

        // Fetch all vendorStock records related to the given vendorFormId
        const vendorStocks = await VendorStock.find({ vendorFormId }).populate('vendorFormId');

        if (!vendorStocks || vendorStocks.length === 0) {
            return res.status(404).json({ error: 'No vendor Stock entries found for this vendor Form ID' });
        }

        // Map the data to extract only required fields
        const formattedData = vendorStocks.map(stock => ({
            _id: stock._id,
            vendorFormId: stock.vendorFormId._id, // Convert object to string ID
            particular: stock.particular,
            hsn: stock.hsn,
            quantity: stock.quantity,
            rate: stock.rate,
            gst: stock.gst,
            amount: stock.amount,
            status: stock.status,
            pricePerKgBag: stock.pricePerKgBag,
            amountPaid: stock.amountPaid,
            amountLeft: stock.amountLeft,
            weight: stock.weight,
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
            transportationCost: stock.transportationCost

        }));

        res.status(200).json(formattedData);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching vendor Stock entries', details: error.message });
    }
};

// Update a vendor Form
exports.updateVendorStock = async (req, res) => {
    try {
        const { id } = req.params; // Use the document's unique _id

        const updatedVendorForm = await VendorStock.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedVendorForm) {
            return res.status(404).json({ error: 'vendor Form not found' });
        }

        res.status(200).json({ message: 'vendor Form updated successfully', updatedVendorForm });
    } catch (error) {
        res.status(500).json({ error: 'Error updating vendor Form' });
    }
};


// Delete a vendor Entry and associated vendor Form
exports.deleteVendorStock = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedVendorStock = await VendorStock.findByIdAndDelete(id);

        if (!deletedVendorStock) {
            return res.status(404).json({ error: 'VendorStock not found' });
        }

        // Recalculate transportationCost for remaining entries
        const vendorForm = await VendorForm.findById(deletedVendorStock.vendorFormId);
        const remainingStocks = await VendorStock.find({ vendorFormId: deletedVendorStock.vendorFormId });

        if (remainingStocks.length > 0 && vendorForm) {
            const dividedCost = vendorForm.transportationCost / remainingStocks.length;
            await VendorStock.updateMany(
                { vendorFormId: deletedVendorStock.vendorFormId },
                { transportationCost: dividedCost }
            );
        }

        res.status(200).json({ message: 'vendorStock deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting vendorStock', details: error.message });
    }
};

exports.calculateTotalsForVendorStock = async (req, res) => {
    try {
        const { vendorStockId } = req.params;
        
        // Find all vendorSingleStock entries related to this vendorStockId
        const vendorSingleStocks = await VendorSingleStock.find({ vendorStockId });
        if (!vendorSingleStocks.length) {
            return res.status(404).json({ error: 'No stock entries found for this vendor Stock ID' });
        }

        // Calculate totals
        const totals = vendorSingleStocks.reduce((acc, stock) => {
            acc.totalBagWeight += parseFloat(stock.bagWeight) || 0;
            acc.totalPurchaseRate += parseFloat(stock.purchaseRate) || 0;
            acc.totalValue += stock.totalValue || 0;
            acc.actualValue += stock.actualValue || 0;
            acc.valueDiff += stock.valueDiff || 0;
            return acc;
        }, { totalBagWeight: 0, totalPurchaseRate: 0, totalValue: 0, actualValue: 0, valueDiff: 0 });

        // Update the vendorStock document with calculated totals
        const updatedvendorStock = await VendorStock.findByIdAndUpdate(
            vendorStockId,
            { 
                totalBagWeight: totals.totalBagWeight,
                totalPurchaseRate: totals.totalPurchaseRate,
                totalValue: totals.totalValue,
                actualValue: totals.actualValue,
                valueDiff: totals.valueDiff
            },
            { new: true } // Return updated document
        );

        if (!updatedvendorStock) {
            return res.status(404).json({ error: 'vendor Stock not found' });
        }

        res.status(200).json({ message: 'Totals calculated and updated successfully', updatedvendorStock });
    } catch (error) {
        res.status(500).json({ error: 'Error calculating and updating totals', details: error.message });
    }
};