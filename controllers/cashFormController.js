const Cash = require('../models/cashModel');
const CashForm = require('../models/cashFormModel');

const SequenceTracker = require('../models/SequenceTracker'); // Import the SequenceTracker model

const generatePoNo = async (stateCode, date) => {
    const datePart = date.toISOString().slice(2, 10).replace(/-/g, ''); // Extract YYMMDD from the date
    const startOfDay = new Date(date.setHours(0, 0, 0, 0)); // Start of the day
    const endOfDay = new Date(date.setHours(23, 59, 59, 999)); // End of the day

    // Find or create a sequence tracker for the given date and state code
    let sequenceTracker = await SequenceTracker.findOne({ date: { $gte: startOfDay, $lt: endOfDay }, stateCode });

    if (!sequenceTracker) {
        // If no sequence exists for this date and state code, start with 'AA'
        sequenceTracker = new SequenceTracker({
            date: startOfDay,
            stateCode,
            lastSequence: 'AA',
        });
    } else {
        // Increment the sequence
        const lastSequence = sequenceTracker.lastSequence;
        const firstChar = lastSequence[0]; // First character of the sequence
        const secondChar = lastSequence[1]; // Second character of the sequence

        if (secondChar === 'Z') {
            // If the second character is 'Z', increment the first character and reset the second to 'A'
            sequenceTracker.lastSequence = String.fromCharCode(firstChar.charCodeAt(0) + 1) + 'A';
        } else {
            // Otherwise, increment the second character
            sequenceTracker.lastSequence = firstChar + String.fromCharCode(secondChar.charCodeAt(0) + 1);
        }
    }

    // Save the updated sequence tracker
    await sequenceTracker.save();

    // Generate the PO number
    return `${sequenceTracker.lastSequence}${datePart}${stateCode}`;
};
exports.createCashForm = async (req, res) => {
    try {
        const { cashId, companyName, companyAddress, gstinSelf, stateName, stateCode, email, sellerName, sellerAddress, gstinPurchase, date, remarks, transport, vehicleNo, eDate, invoiceDate, eBill, unitType, product, transportationCost, adminCost } = req.body;

        console.log('Request Body:', req.body);

        const cash = await Cash.findById(cashId);
        if (!cash) {
            return res.status(404).json({ error: 'Cash not found' });
        }

        // Convert YYYY-MM-DD to JavaScript Date object
        const parseDate = (dateString) => {
            if (!dateString) return null;
            return new Date(dateString);
        };

        const formattedDate = parseDate(date);
        const formattedEDate = parseDate(eDate);
        const formattedInvoiceDate = parseDate(invoiceDate);

        if (!formattedDate || !formattedEDate || !formattedInvoiceDate) {
            return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD.' });
        }

        const poNo = await generatePoNo(stateCode, formattedDate);

        const cashForm = new CashForm({
            cashId,
            cashName: cash.name,
            companyName,
            companyAddress,
            gstinSelf,
            stateName,
            stateCode,
            email,
            sellerName,
            sellerAddress: cash.address,
            gstinPurchase,
            poNo,
            date: formattedDate,
            remarks,
            transport,
            vehicleNo,
            eDate: formattedEDate,
            invoiceDate: formattedInvoiceDate,
            eBill,
            unitType,
            product,
            transportationCost,
            adminCost
            
        });

        await cashForm.save();
        res.status(201).json({ message: 'Cash Form created successfully', cashForm });
    } catch (error) {
        console.error('Error creating Cash Form:', error);
        res.status(500).json({ error: 'Error creating Cash Form', details: error.message });
    }
};

// Get all Cash Entries
exports.getAllCashForm = async (req, res) => {
    try {
        const cashEntries = await CashForm.find();
        res.status(200).json(cashEntries);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching Cash entries' });
    }
};

// Get Cash Form by Cash ID
// exports.getCashFormByCashId = async (req, res) => {
//     try {
//         const { cashId } = req.params;
//         const cashForm = await CashForm.findOne({ cashId }).populate('cashId');
//         if (!cashForm) {
//             return res.status(404).json({ error: 'Cash Form not found' });
//         }
//         res.status(200).json(cashForm);
//     } catch (error) {
//         res.status(500).json({ error: 'Error fetching Cash Form' });
//     }
// };

exports.getCashFormByCashId = async (req, res) => {
    try {
        const { cashId } = req.params;

        // Fetch all cashStock records related to the given cashFormId
        const cashForm = await CashForm.find({ cashId }).populate('cashId');

        if (!cashForm || cashForm.length === 0) {
            return res.status(404).json({ error: 'No Cash Stock entries found for this Cash Form ID' });
        }

        // Map the data to extract only required fields
        const formattedData = cashForm.map(stock => ({
            _id: stock._id,
            cashId: stock.cashId._id,
            cashName: stock.cashName,
            companyName: stock.companyName,
            companyAddress: stock.companyAddress,
            gstinSelf: stock.gstinSelf,
            stateName: stock.stateName,
            stateCode: stock.stateCode,
            email: stock.email,
            sellerName: stock.sellerName,
            sellerAddress: stock.sellerAddress,
            gstinPurchase: stock.gstinPurchase,
            poNo: stock.poNo,
            date: stock.date,
            remarks: stock.remarks,
            transport: stock.transport,
            vehicleNo: stock.vehicleNo,
            eDate: stock.eDate,
            invoiceDate: stock.invoiceDate,
            eBill: stock.eBill,
            unitType: stock.unitType,
            product: stock.product,
            transportationCost: stock.transportationCost,
            adminCost: stock.adminCost
        }));

        res.status(200).json(formattedData);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching Cash Stock entries', details: error.message });
    }
};

// Update a Cash Form
exports.updateCashForm = async (req, res) => {
    try {
        const { id } = req.params; // Use the document's unique _id

        const updatedCashForm = await CashForm.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedCashForm) {
            return res.status(404).json({ error: 'Cash Form not found' });
        }

        res.status(200).json({ message: 'Cash Form updated successfully', updatedCashForm });
    } catch (error) {
        res.status(500).json({ error: 'Error updating Cash Form' });
    }
};


// Delete a Cash Entry and associated Cash Form
exports.deleteCashForm = async (req, res) => {
    try {
        const { id } = req.params; // Use the document's unique _id

        const deletedCashForm = await CashForm.findByIdAndDelete(id);
        if (!deletedCashForm) {
            return res.status(404).json({ error: 'Cash Form not found' });
        }

        res.status(200).json({ message: 'Cash Form deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting Cash Form' });
    }
};

