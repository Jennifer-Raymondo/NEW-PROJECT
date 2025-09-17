const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'Active'
  }
});



userSchema.plugin(passportLocalMongoose, {
  usernameField:'email'
});


module.exports = mongoose.model('user', userSchema);
