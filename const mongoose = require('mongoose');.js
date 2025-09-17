const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true
    
  },
productType: {
    type: String,
    required: true,
  },

  productName: {
    type:Number,
    required:true
  },

  quantity: {
    type:Number,
    required:true
  },
  
    salesAgent: {
        type:String,
        reqiured:true
  },
});



module.exports = mongoose.model('salesModel', salesSchema);
