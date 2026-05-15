const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

exports.getSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [accounts, monthlyStats, lastMonthStats, categoryBreakdown, recentTransactions, budgets] =
      await Promise.all([
        Account.find({ user: req.user._id }),

        Transaction.aggregate([
          {
            $match: {
              user: req.user._id,
              date: { $gte: startOfMonth, $lte: endOfMonth },
              type: { $in: ['income', 'expense'] },
            },
          },
          { $group: { _id: '$type', total: { $sum: '$amount' } } },
        ]),

        Transaction.aggregate([
          {
            $match: {
              user: req.user._id,
              date: { $gte: startOfLastMonth, $lte: endOfLastMonth },
              type: { $in: ['income', 'expense'] },
            },
          },
          { $group: { _id: '$type', total: { $sum: '$amount' } } },
        ]),

        Transaction.aggregate([
          {
            $match: {
              user: req.user._id,
              date: { $gte: startOfMonth, $lte: endOfMonth },
              type: 'expense',
              category: { $ne: null },
            },
          },
          { $group: { _id: '$category', total: { $sum: '$amount' } } },
          {
            $lookup: {
              from: 'categories',
              localField: '_id',
              foreignField: '_id',
              as: 'category',
            },
          },
          { $unwind: '$category' },
          { $sort: { total: -1 } },
          { $limit: 6 },
          {
            $project: {
              name: '$category.name',
              icon: '$category.icon',
              color: '$category.color',
              total: 1,
            },
          },
        ]),

        Transaction.find({ user: req.user._id })
          .sort({ date: -1, createdAt: -1 })
          .limit(8)
          .populate('category', 'name icon color')
          .populate('account', 'name color'),

        Budget.find({ user: req.user._id }).populate('category', 'name icon color'),
      ]);

    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
    const income = monthlyStats.find(s => s._id === 'income')?.total || 0;
    const expenses = monthlyStats.find(s => s._id === 'expense')?.total || 0;
    const lastIncome = lastMonthStats.find(s => s._id === 'income')?.total || 0;
    const lastExpenses = lastMonthStats.find(s => s._id === 'expense')?.total || 0;

    const budgetSummary = await Promise.all(
      budgets.slice(0, 4).map(async (b) => {
        const result = await Transaction.aggregate([
          {
            $match: {
              user: req.user._id,
              category: b.category._id,
              type: 'expense',
              date: { $gte: startOfMonth, $lte: endOfMonth },
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const spent = result[0]?.total || 0;
        return {
          id: b._id,
          name: b.name || b.category.name,
          icon: b.category.icon,
          color: b.category.color,
          amount: b.amount,
          spent,
          percentage: Math.min((spent / b.amount) * 100, 100).toFixed(1),
        };
      })
    );

    res.json({
      totalBalance,
      monthlyIncome: income,
      monthlyExpenses: expenses,
      savingsRate: income > 0 ? (((income - expenses) / income) * 100).toFixed(1) : '0.0',
      incomeChange: lastIncome > 0 ? (((income - lastIncome) / lastIncome) * 100).toFixed(1) : null,
      expensesChange: lastExpenses > 0 ? (((expenses - lastExpenses) / lastExpenses) * 100).toFixed(1) : null,
      categoryBreakdown,
      recentTransactions,
      budgetSummary,
      accountCount: accounts.length,
    });
  } catch (err) {
    next(err);
  }
};
