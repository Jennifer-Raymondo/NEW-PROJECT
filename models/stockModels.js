const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  productType: { type: String, required: true },
  supplierName: { type: String, required: false },
  quantity: { type: Number, required: true },
  costPrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true, default: 0 },   // ✅ default
  //category: { type: String, required: true, enum: ['raw material', 'finished products'] },
  dateReceived: { type: Date, required: true, default: Date.now }, // ✅ default
  quality: { type: String, required: true, enum: ['premium', 'standard', 'lowGrade'], default: 'standard' } // ✅ default
});

module.exports = mongoose.model('Stock', stockSchema);
