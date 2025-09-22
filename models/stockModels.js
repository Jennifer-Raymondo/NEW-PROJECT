const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true
    
  },

 productType: {
    type:String,
    required:true
  },
  supplierName: {
    type:String,
    required:true
  },

  quantity: {
    type:Number,
    required:true
  },

 costPrice: {
    type:Number,
    required:true
  },

 category: {
  type: String,
  required: true,
  enum: ['raw material', 'finished products'] 
},

 dateReceived: {
    type:Date,
    required:true
  },

    quality: {
        type:String,
        required:true
  },
});



module.exports = mongoose.model('stock', stockSchema);
