const Transaction = require('../models/Transaction');
const Account = require('../models/Account');

const applyBalanceChange = async (accountId, amount, type, direction = 1) => {
  const delta = type === 'income' ? amount * direction : -amount * direction;
  await Account.findByIdAndUpdate(accountId, { $inc: { balance: delta } });
};

exports.getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, category, account, startDate, endDate, search } = req.query;
    const query = { user: req.user._id };

    if (type) query.type = type;
    if (category) query.category = category;
    if (account) query.account = account;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }
    if (search) {
      // Escape regex metacharacters to prevent regex injection via user input
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.description = { $regex: safeSearch, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('category', 'name icon color')
        .populate('account', 'name color'),
      Transaction.countDocuments(query),
    ]);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.createTransaction = async (req, res, next) => {
  try {
    const { accountId, categoryId, amount, type, description, date, notes } = req.body;

    if (!accountId || !amount || !type || !description) {
      return res.status(400).json({ message: 'Account, amount, type, and description are required' });
    }
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ message: 'Type must be income or expense' });
    }

    const account = await Account.findOne({ _id: accountId, user: req.user._id });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    const transaction = await Transaction.create({
      user: req.user._id,
      account: accountId,
      category: categoryId || null,
      amount: parseFloat(amount),
      type,
      description: description.trim(),
      date: date ? new Date(date) : new Date(),
      notes: notes || '',
    });

    await applyBalanceChange(accountId, parseFloat(amount), type, 1);

    const populated = await transaction.populate([
      { path: 'category', select: 'name icon color' },
      { path: 'account', select: 'name color' },
    ]);

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

exports.updateTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    // Reverse old balance effect
    await applyBalanceChange(transaction.account, transaction.amount, transaction.type, -1);

    const { accountId, categoryId, amount, type, description, date, notes } = req.body;

    if (accountId !== undefined) transaction.account = accountId;
    if (categoryId !== undefined) transaction.category = categoryId || null;
    if (amount !== undefined) transaction.amount = parseFloat(amount);
    if (type !== undefined) transaction.type = type;
    if (description !== undefined) transaction.description = description.trim();
    if (date !== undefined) transaction.date = new Date(date);
    if (notes !== undefined) transaction.notes = notes;

    await transaction.save();

    // Apply new balance effect
    await applyBalanceChange(transaction.account, transaction.amount, transaction.type, 1);

    const populated = await transaction.populate([
      { path: 'category', select: 'name icon color' },
      { path: 'account', select: 'name color' },
    ]);

    res.json(populated);
  } catch (err) {
    next(err);
  }
};

exports.deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    // Reverse balance effect
    await applyBalanceChange(transaction.account, transaction.amount, transaction.type, -1);

    await transaction.deleteOne();
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    next(err);
  }
};

exports.getMonthlyStats = async (req, res, next) => {
  try {
    const now = new Date();
    const months = 6;
    const data = [];

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const stats = await Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            date: { $gte: start, $lte: end },
            type: { $in: ['income', 'expense'] },
          },
        },
        { $group: { _id: '$type', total: { $sum: '$amount' } } },
      ]);

      data.push({
        month: start.toLocaleString('default', { month: 'short' }),
        year: start.getFullYear(),
        income: stats.find(s => s._id === 'income')?.total || 0,
        expenses: stats.find(s => s._id === 'expense')?.total || 0,
      });
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
};
