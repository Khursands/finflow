const { Schema, model } = require('mongoose');

const accountSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['checking', 'savings', 'credit', 'cash', 'investment'],
    default: 'checking',
  },
  balance: { type: Number, default: 0 },
  color: { type: String, default: '#6366f1' },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = model('Account', accountSchema);
