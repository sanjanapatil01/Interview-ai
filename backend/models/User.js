const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  usertype: { type: String, enum: ["candidate", "admin"], default: "candidate" },
  otp:      { type: String },
  otpExpires: { type: Date },
  uid:{type:String,required:true},
  
  // NEW FIELD: Temporarily holds the hash of the new password during OTP verification
  tempPasswordHash: { type: String }, 
});

module.exports = mongoose.model("User", userSchema);