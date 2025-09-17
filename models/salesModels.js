const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true
    
  },
 productType: {
    type:String,
    required:true
  },
  productName: {
    type:String,
    required:true
  },

  quantity: {
    type:Number,
    required:true
  },


  Date: {
    type:Date,
    required:true
  },

    salesAgent: {
        type:String,
        required:true
  },
  transport: { 
    type: String, 
    required: true 
  },
  paymentType: { 
    type: String, 
    required: true 
  },
  
});



module.exports = mongoose.model('sale', salesSchema);
