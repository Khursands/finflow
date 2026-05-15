const Category = require('../models/Category');

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ user: req.user._id }).sort({ type: 1, name: 1 });
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, icon, color, type } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required' });

    const category = await Category.create({
      user: req.user._id,
      name,
      icon: icon || '📦',
      color: color || '#6b7280',
      type: type || 'expense',
    });

    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, user: req.user._id });
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const { name, icon, color, type } = req.body;
    if (name !== undefined) category.name = name;
    if (icon !== undefined) category.icon = icon;
    if (color !== undefined) category.color = color;
    if (type !== undefined) category.type = type;

    await category.save();
    res.json(category);
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, user: req.user._id });
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (category.isDefault) {
      return res.status(400).json({ message: 'Default categories cannot be deleted' });
    }

    await category.deleteOne();
    res.json({ message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
};
