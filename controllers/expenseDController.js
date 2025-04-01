const ExpenseD = require('../models/expenseD');

// Create a new expense
exports.createExpense = async (req, res) => {
    try {
        const expense = new ExpenseD(req.body);
        await expense.save();
        res.status(201).json(expense);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get all expenses
exports.getAllExpenses = async (req, res) => {
    try {
        const expenses = await ExpenseD.find();
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get expense by ID
exports.getExpenseById = async (req, res) => {
    try {
        const expense = await ExpenseD.findById(req.params.id);
        if (!expense) return res.status(404).json({ message: 'ExpenseD not found' });
        res.json(expense);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update expense by ID
exports.updateExpense = async (req, res) => {
    try {
        const expense = await ExpenseD.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!expense) return res.status(404).json({ message: 'ExpenseD not found' });
        res.json(expense);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete expense by ID
exports.deleteExpense = async (req, res) => {
    try {
        const expense = await ExpenseD.findByIdAndDelete(req.params.id);
        if (!expense) return res.status(404).json({ message: 'ExpenseD not found' });
        res.json({ message: 'ExpenseD deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};