const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const signupSchema = new mongoose.Schema({
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
});



signupSchema.plugin(passportLocalMongoose,{
  usernameField: 'email'
 });


module.exports = mongoose.model('signup', signupSchema);
