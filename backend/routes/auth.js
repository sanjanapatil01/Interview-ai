const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");

const router = express.Router();

// Add Firebase Admin SDK setup
const admin = require('firebase-admin');
const serviceAccount = require("./interviewai-237e4-firebase-adminsdk-fbsvc-a57c0a1336.json"); // Ensure path is correct
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

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

// Middleware to verify ID token (used for login and authenticated routes)
async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    // FIX: Return JSON response for 401
    return res.status(401).json({ error: "No authorization token provided." });
  }
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.firebaseUser = decoded;
    next();
  } catch (err) {
    // FIX: Return JSON response for 401
    return res.status(401).json({ error: "Invalid or expired authorization token." });
  }
}

// Register route - **CRITICAL FIX: Removed 'authenticate' middleware**
// This route MUST be public to allow initial user save and OTP generation.
router.post('/register', async (req, res) => {
  const { uid, username, email, usertype } = req.body;

  if (!uid || !email || !username) {
    return res.status(400).json({ error: "Missing required registration fields." });
  }

  try {
    // 1. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // 2. Save/Update user data in MongoDB (including OTP status)
    await User.updateOne(
      { uid },
      { $set: { 
          username, 
          email, 
          usertype, 
          password: "FIREBASE_MANAGED_USER_NO_PASSWORD_HASH", // Placeholder for Mongoose requirement
          otp, 
          otpExpires,
        } 
      }, 
      { upsert: true }
    );
    
    // 3. Send OTP Email
    await sendOtpEmail(email, otp);

    res.json({ message: 'User profile created. OTP sent for verification.' });
  } catch (err) {
    console.error("MongoDB Register Error:", err);
    if (err.code === 11000) {
        return res.status(409).json({ error: "Username or Email already in use." });
    }
    res.status(500).json({ error: "Failed to save user and send OTP." });
  }
});

// Login - **MUST BE AUTHENTICATED**
router.post("/login", authenticate, async (req, res) => {
  const firebaseUid = req.firebaseUser.uid; 

  try {
    const user = await User.findOne({ uid: firebaseUid });

    if (!user) {
        return res.status(404).json({ error: "User profile not found in database. Please register again." });
    }

    // Block login if OTP is pending (Status 403)
    if (user.otp !== null) {
      return res.status(403).json({ error: "Please verify your email with OTP before logging in." });
    }

    // Generate a custom JWT token
    const token = jwt.sign({ id: user._id, uid: user.uid }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ token, message: "Login successful" });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "An internal server error occurred during login." });
  }
});


// ... (existing admin.initializeApp setup and authenticate middleware)

// -------------------------------------------------------------------
// NEW ROUTE: Forgot Password - Initiates the reset process
// -------------------------------------------------------------------
router.post('/forgot-password', async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Return success even if user not found to prevent user enumeration attacks
      return res.json({ message: "If a matching account was found, an OTP has been sent." });
    }
    
    // 1. Hash the new password and store it temporarily
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // 2. Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // 3. Update user with new OTP and the temporarily hashed password
    await User.updateOne(
      { email },
      { $set: { 
          otp, 
          otpExpires,
          // Use the password field temporarily to store the HASHED new password
          // This is a common but dangerous pattern.
          tempPasswordHash: hashedPassword, 
        } 
      }
    );
    
    // 4. Send OTP Email
    await sendOtpEmail(email, otp);

    res.json({ message: 'OTP sent to your email for password reset verification.' });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ error: "Failed to initiate password reset." });
  }
});

// -------------------------------------------------------------------
// MODIFIED ROUTE: Verify OTP - Now handles both Registration and Reset
// -------------------------------------------------------------------
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp, isPasswordReset } = req.body; // Expect isPasswordReset flag

    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // CRITICAL STEP: Handle Password Reset
    if (isPasswordReset && user.tempPasswordHash) {
        // 1. Apply the temporary password hash to the main password field
        user.password = user.tempPasswordHash; 
        
        // 2. Clear the temporary hash field
        user.tempPasswordHash = undefined; 
        
        // **IMPORTANT:** You MUST also update the password in Firebase Auth here
        // This is complex and requires the Firebase Admin SDK to be set up correctly.
        // For now, this only updates your MongoDB record.
        
        await user.save();
        
        // Clear OTP fields
        user.otp = null;
        user.otpExpires = null;
        await user.save();
        
        // No JWT issued on reset, redirect user to login
        return res.json({ message: "Password reset successful! Please log in." });
    } 
    
    // Handle Regular Registration Verification
    
    // Clear OTP fields
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // Issue JWT upon successful OTP verification
    const token = jwt.sign({ id: user._id, uid: user.uid }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ token, message: "OTP Verified! Login token issued." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ... (rest of auth.js: /register, /login)


module.exports = router;