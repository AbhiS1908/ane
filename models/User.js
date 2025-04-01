const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'purchase', 'segregation', 'packaging', 'expense', 'credentials', 'expenseD'], required: true }
});

UserSchema.pre('save', async function (next) {
  
});

UserSchema.methods.generateToken = function () {
  return jwt.sign({ userId: this._id, role: this.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

module.exports = mongoose.model('User', UserSchema);