const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

exports.getAccounts = async (req, res, next) => {
  try {
    const accounts = await Account.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: 1 });
    res.json(accounts);
  } catch (err) {
    next(err);
  }
};

exports.createAccount = async (req, res, next) => {
  try {
    const { name, type, balance, color } = req.body;
    if (!name) return res.status(400).json({ message: 'Account name is required' });

    const account = await Account.create({
      user: req.user._id,
      name,
      type: type || 'checking',
      balance: balance || 0,
      color: color || '#6366f1',
    });

    res.status(201).json(account);
  } catch (err) {
    next(err);
  }
};

exports.updateAccount = async (req, res, next) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    const { name, type, color, isDefault } = req.body;
    if (name !== undefined) account.name = name;
    if (type !== undefined) account.type = type;
    if (color !== undefined) account.color = color;
    if (isDefault !== undefined) account.isDefault = isDefault;

    await account.save();
    res.json(account);
  } catch (err) {
    next(err);
  }
};

exports.deleteAccount = async (req, res, next) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    const txCount = await Transaction.countDocuments({ account: account._id });
    if (txCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete account with existing transactions. Delete transactions first.',
      });
    }

    await account.deleteOne();
    res.json({ message: 'Account deleted' });
  } catch (err) {
    next(err);
  }
};
