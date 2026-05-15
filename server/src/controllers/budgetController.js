const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

const getCurrentPeriodDates = (period, month) => {
  const now = new Date();
  if (period === 'monthly') {
    const [year, mon] = month
      ? month.split('-').map(Number)
      : [now.getFullYear(), now.getMonth() + 1];
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 0, 23, 59, 59);
    return { start, end };
  }
  if (period === 'weekly') {
    const dayOfWeek = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  return { start, end };
};

exports.getBudgets = async (req, res, next) => {
  try {
    const budgets = await Budget.find({ user: req.user._id })
      .populate('category', 'name icon color');

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const { start, end } = getCurrentPeriodDates(budget.period, budget.month || currentMonth);
        const result = await Transaction.aggregate([
          {
            $match: {
              user: req.user._id,
              category: budget.category._id,
              type: 'expense',
              date: { $gte: start, $lte: end },
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        const spent = result[0]?.total || 0;
        return {
          ...budget.toObject(),
          spent,
          remaining: budget.amount - spent,
          percentage: Math.min((spent / budget.amount) * 100, 100).toFixed(1),
        };
      })
    );

    res.json(budgetsWithSpent);
  } catch (err) {
    next(err);
  }
};

exports.createBudget = async (req, res, next) => {
  try {
    const { categoryId, name, amount, period, month } = req.body;
    if (!categoryId || !amount) {
      return res.status(400).json({ message: 'Category and amount are required' });
    }

    const budget = await Budget.create({
      user: req.user._id,
      category: categoryId,
      name,
      amount: parseFloat(amount),
      period: period || 'monthly',
      month,
    });

    await budget.populate('category', 'name icon color');
    res.status(201).json(budget);
  } catch (err) {
    next(err);
  }
};

exports.updateBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, user: req.user._id });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });

    const { name, amount, period, month } = req.body;
    if (name !== undefined) budget.name = name;
    if (amount !== undefined) budget.amount = parseFloat(amount);
    if (period !== undefined) budget.period = period;
    if (month !== undefined) budget.month = month;

    await budget.save();
    await budget.populate('category', 'name icon color');
    res.json(budget);
  } catch (err) {
    next(err);
  }
};

exports.deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, user: req.user._id });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });

    await budget.deleteOne();
    res.json({ message: 'Budget deleted' });
  } catch (err) {
    next(err);
  }
};
