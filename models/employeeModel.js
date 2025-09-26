const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const employeeSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  department: { type: String },
  username: { type: String, required: true, unique: true },
  role: { 
    type: String, 
    enum: ["manager", "supervisor", "attendant"], // ✅ added supervisor
    required: true 
  }
});

// Adds username, hash + salt, and authentication helpers
employeeSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("Employee", employeeSchema);
