const { Schema, model } = require('mongoose');

const categorySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  name: { type: String, required: true, trim: true },
  icon: { type: String, default: '📦' },
  color: { type: String, default: '#6b7280' },
  type: { type: String, enum: ['income', 'expense', 'both'], default: 'expense' },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = model('Category', categorySchema);
