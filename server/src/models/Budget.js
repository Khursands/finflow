const { Schema, model } = require('mongoose');

const budgetSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  name: { type: String, trim: true },
  amount: { type: Number, required: true, min: 0.01 },
  period: { type: String, enum: ['weekly', 'monthly', 'yearly'], default: 'monthly' },
  month: { type: String },
}, { timestamps: true });

module.exports = model('Budget', budgetSchema);
