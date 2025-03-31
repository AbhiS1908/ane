const FarmerStock = require('../models/farmerStockModel');
const FarmerForm = require('../models/farmerFormModel');
const FarmerSingleStock = require('../models/farmerSingleStockModel');

// Create a farmer Form linked to farmer ID
exports.createFarmerStock = async (req, res) => {
    try {
        const { farmerFormId, product, particular, hsn, quantity, rate, pricePerKgBag, gst, amount, status, amountPaid, amountLeft, profit, weight } = req.body;
        
        const farmer = await FarmerForm.findById(farmerFormId);
        if (!farmer) {
            return res.status(404).json({ error: 'farmer not found' });
        }

         const existingFarmerStocks = await FarmerStock.find({ farmerFormId });
                const totalEntries = existingFarmerStocks.length + 1; // Include the new entry
        
                // Divide the transportationCost equally
                const dividedTransportationCost = farmer.transportationCost / totalEntries;
        
                // Update existing farmerStock entries with the new divided cost
                if (existingFarmerStocks.length > 0) {
                    await FarmerStock.updateMany(
                        { farmerFormId },
                        { transportationCost: dividedTransportationCost }
                    );
                }

        const farmerStock = new FarmerStock({
            farmerFormId,
            farmerName: farmer.farmerName,
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
            poNo: farmer.poNo,
            transportationCost: dividedTransportationCost, // Add this line
            eDate: farmer.eDate
           
        });

        await farmerStock.save();
        res.status(201).json({ message: 'farmer Form created successfully', farmerStock });
    } catch (error) {
        res.status(500).json({ error: 'Error creating farmer Form' });
    }
};

// Get all farmer Entries
exports.getAllFarmerStock = async (req, res) => {
    try {
        const farmerEntries = await FarmerStock.find();
        res.status(200).json(farmerEntries);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching farmer entries' });
    }
};

exports.getFarmerStockById = async (req, res) => {
    try {
        const { id } = req.params;
        const farmerStock = await FarmerStock.findById(id);
        
        if (!farmerStock) {
            return res.status(404).json({ error: 'farmerStock not found' });
        }

        res.status(200).json(farmerStock);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching farmerStock' });
    }
};

// Get farmer Form by farmer ID
exports.getFarmerStockByFarmerId = async (req, res) => {
    try {
        const { farmerFormId } = req.params;

        // Fetch all farmerStock records related to the given farmerFormId
        const farmerStocks = await FarmerStock.find({ farmerFormId }).populate('farmerFormId');

        if (!farmerStocks || farmerStocks.length === 0) {
            return res.status(404).json({ error: 'No farmer Stock entries found for this farmer Form ID' });
        }

        // Map the data to extract only required fields
        const formattedData = farmerStocks.map(stock => ({
            _id: stock._id,
            farmerFormId: stock.farmerFormId._id, // Convert object to string ID
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
            transportationCost: stock.transportationCost,
            eDate: stock.eDate



        }));

        res.status(200).json(formattedData);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching farmer Stock entries', details: error.message });
    }
};


// Update a farmer Form
exports.updateFarmerStock = async (req, res) => {
    try {
        const { id } = req.params; // Use the document's unique _id

        const updatedFarmerForm = await FarmerStock.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedFarmerForm) {
            return res.status(404).json({ error: 'farmer Form not found' });
        }

        res.status(200).json({ message: 'farmer Form updated successfully', updatedFarmerForm });
    } catch (error) {
        res.status(500).json({ error: 'Error updating farmer Form' });
    }
};


// Delete a farmer Entry and associated farmer Form
exports.deleteFarmerStock = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedFarmerStock = await FarmerStock.findByIdAndDelete(id);

        if (!deletedFarmerStock) {
            return res.status(404).json({ error: 'FarmerStock not found' });
        }

        // Recalculate transportationCost for remaining entries
        const farmerForm = await FarmerForm.findById(deletedFarmerStock.farmerFormId);
        const remainingStocks = await FarmerStock.find({ farmerFormId: deletedFarmerStock.farmerFormId });

        if (remainingStocks.length > 0 && farmerForm) {
            const dividedCost = farmerForm.transportationCost / remainingStocks.length;
            await FarmerStock.updateMany(
                { farmerFormId: deletedFarmerStock.farmerFormId },
                { transportationCost: dividedCost }
            );
        }

        res.status(200).json({ message: 'farmerStock deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting farmerStock', details: error.message });
    }
};

exports.calculateTotalsForFarmerStock = async (req, res) => {
    try {
        const { farmerStockId } = req.params;
        
        // Find all farmerSingleStock entries related to this farmerStockId
        const farmerSingleStocks = await FarmerSingleStock.find({ farmerStockId });
        if (!farmerSingleStocks.length) {
            return res.status(404).json({ error: 'No stock entries found for this farmer Stock ID' });
        }

        // Calculate totals
        const totals = farmerSingleStocks.reduce((acc, stock) => {
            acc.totalBagWeight += parseFloat(stock.bagWeight) || 0;
            acc.totalPurchaseRate += parseFloat(stock.purchaseRate) || 0;
            acc.totalValue += stock.totalValue || 0;
            acc.actualValue += stock.actualValue || 0;
            acc.valueDiff += stock.valueDiff || 0;
            return acc;
        }, { totalBagWeight: 0, totalPurchaseRate: 0, totalValue: 0, actualValue: 0, valueDiff: 0 });

        // Update the farmerStock document with calculated totals
        const updatedFarmerStock = await FarmerStock.findByIdAndUpdate(
            farmerStockId,
            { 
                totalBagWeight: totals.totalBagWeight,
                totalPurchaseRate: totals.totalPurchaseRate,
                totalValue: totals.totalValue,
                actualValue: totals.actualValue,
                valueDiff: totals.valueDiff
            },
            { new: true } // Return updated document
        );

        if (!updatedFarmerStock) {
            return res.status(404).json({ error: 'farmer Stock not found' });
        }

        res.status(200).json({ message: 'Totals calculated and updated successfully', updatedFarmerStock });
    } catch (error) {
        res.status(500).json({ error: 'Error calculating and updating totals', details: error.message });
    }
};

