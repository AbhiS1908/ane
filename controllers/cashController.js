const Cash = require('../models/cashModel');
exports.createCash = async (req, res) => {
    try {
        const cash = new Cash(req.body);
        await cash.save();
        res.status(201).json(cash);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.getAllCash = async (req, res) => {
    const cash = await Cash.find();
    res.json(cash);
};
exports.updateCash = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedCash = await Cash.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

        if (!updatedCash) {
            return res.status(404).json({ error: "Cash record not found" });
        }

        res.json(updatedCash);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete cash record
exports.deleteCash = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCash = await Cash.findByIdAndDelete(id);

        if (!deletedCash) {
            return res.status(404).json({ error: "Cash record not found" });
        }

        res.json({ message: "Cash record deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
