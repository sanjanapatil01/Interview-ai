const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");

const router = express.Router();

// Send OTP via email
const sendOtpEmail = async (email, otp) => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Interview.ai OTP Code",
    text: `Your OTP is ${otp}`,
  });
};

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, usertype } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    const user = new User({
      username,
      email,
      password: hashedPassword,
      usertype,
      otp,
      otpExpires,
    });

    await user.save();
    await sendOtpEmail(email, otp);

    res.status(201).json({ message: "Registered successfully. OTP sent!" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({ message: "OTP Verified!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Match either username OR email
  const user = await User.findOne({
    $or: [{ username: username }, { email: username }],
  });

  if (!user) return res.status(404).json({ error: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

  // (Optional) check if OTP was verified
  if (user.otp !== null) {
    return res.status(400).json({ error: "Please verify your email with OTP before logging in" });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

  res.json({ token, message: "Login successful" });
});


module.exports = router;
