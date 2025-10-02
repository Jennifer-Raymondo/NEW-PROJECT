const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true
  },
  productType: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  sellingPrice: {   // price per unit used in this sale
    type: Number,
    required: true
  },
  date: {   // lowercase for consistency
    type: Date,
    required: true
  },
  salesAgent: {
    type: String,
    required: true
  },
  transport: { 
    type: String,   // "Yes" or "No"
    required: true 
  },
  paymentType: { 
    type: String,   // "cash", "cheque", etc.
    required: true 
  }
});

module.exports = mongoose.model('Sale', salesSchema);
