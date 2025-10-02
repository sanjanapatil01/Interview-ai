// File: User.js

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  // password: { type: String, required: true }, // <--- REMOVE THIS LINE
  usertype: { type: String, enum: ["candidate", "admin"], default: "candidate" },
  otp:      { type: String },
  otpExpires: { type: Date },
  uid:{type:String,required:true, unique: true}, // **RECOMMENDATION: Make UID unique**
});

module.exports = mongoose.model("User", userSchema);