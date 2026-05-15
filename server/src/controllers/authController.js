const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Account = require('../models/Account');
const Category = require('../models/Category');
const defaultCategories = require('../utils/defaultCategories');
const { decryptPassword } = require('../utils/keyManager');

const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' });

const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  currency: user.currency,
});

const validatePasswordStrength = (password) => {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  return null;
};

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, encryptedPassword } = req.body;

    // Decrypt the password — throws if tampered or malformed
    let password;
    try {
      password = decryptPassword(encryptedPassword);
    } catch {
      return res.status(400).json({ message: 'Invalid request payload' });
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) return res.status(400).json({ message: passwordError });

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Unable to create account with these details' });
    }

    const user = await User.create({ name, email, password });

    await Category.insertMany(
      defaultCategories.map((c) => ({ ...c, user: user._id, isDefault: true }))
    );

    await Account.create({
      user: user._id,
      name: 'Main Account',
      type: 'checking',
      balance: 0,
      isDefault: true,
    });

    const token = createToken(user._id);
    setTokenCookie(res, token);

    res.status(201).json({ user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, encryptedPassword } = req.body;
    const INVALID_MSG = 'Invalid email or password';

    let password;
    try {
      password = decryptPassword(encryptedPassword);
    } catch {
      return res.status(401).json({ message: INVALID_MSG });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      // Constant-time dummy compare — prevents timing-based email enumeration
      await bcrypt.compare(password, '$2a$12$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
      return res.status(401).json({ message: INVALID_MSG });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: INVALID_MSG });

    const token = createToken(user._id);
    setTokenCookie(res, token);

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'strict', path: '/' });
  res.json({ message: 'Logged out successfully' });
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(401).json({ message: 'Session invalid' });
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
};
