const { Schema, model } = require('mongoose');

const transactionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  account: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  amount: { type: Number, required: true, min: 0.01 },
  type: { type: String, enum: ['income', 'expense'], required: true },
  description: { type: String, required: true, trim: true },
  date: { type: Date, required: true, default: Date.now },
  notes: { type: String, trim: true, default: '' },
}, { timestamps: true });

transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1, date: -1 });

module.exports = model('Transaction', transactionSchema);
