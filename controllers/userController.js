const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const user = new User({ username, password, role });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'User not found' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (password !== user.password) return res.status(400).json({ message: 'Invalid credentials' });    const token = user.generateToken();
    res.json({ token, role: user.role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.authMiddleware = (roles) => (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Access Denied' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!roles.includes(decoded.role)) return res.status(403).json({ message: 'Forbidden' });
    req.user = decoded;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// In getUsers
exports.getUsers = async (req, res) => {
    try {
      const users = await User.find(); // Remove password exclusion
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  // In getUserById
  exports.getUserById = async (req, res) => {
    try {
      const user = await User.findById(req.params.id); // Remove password exclusion
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  // Update User
  exports.updateUser = async (req, res) => {
    try {
      const { username, role, password } = req.body;
      const user = await User.findById(req.params.id);
  
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      // Update password as plain text
      if (password) {
        user.password = password; // Now stored in plain text
      }
      
      user.username = username || user.username;
      user.role = role || user.role;
  
      await user.save();
      res.json({ message: 'User updated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  // Delete User
  exports.deleteUser = async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };