const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User"); // Ensure path to User model is correct
const InterviewSchedule = require('../models/InterviewSchedule');
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const FinalReport = require("../models/FinalReport");


// -------------------------------------------------------------------
// 1. FIREBASE ADMIN SDK SETUP
// CRITICAL: This allows the backend to interact with Firebase Auth (e.g., update password)
// -------------------------------------------------------------------
const admin = require('firebase-admin');
// !! IMPORTANT: Ensure the path to your service account JSON file is correct !!
// This file should be in the same directory as auth.js, or path adjusted (e.g., '../serviceAccount.json')
const serviceAccount = require("./interviewai-237e4-firebase-adminsdk-fbsvc-a57c0a1336.json"); 
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
// -------------------------------------------------------------------


// -------------------------------------------------------------------
// 2. EMAIL UTILITY: Send OTP
// -------------------------------------------------------------------

const sendOtpEmail = async (email, otp) => {
  // CRITICAL: Ensure process.env.EMAIL_USER and process.env.EMAIL_PASS are set correctly 
  // (e.g., in a .env file loaded by dotenv, and for Gmail, use an App Password).
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  const emailSubject = "Interview.ai: Your One-Time Verification Code (OTP)";
  
  const emailBody = `
Dear Interview.ai User,

Your One-Time Verification Code (OTP) is:

                 ${otp}

This code is essential to complete your account verification or password reset request.

Please enter this code on the Interview.ai website within the next 10 minutes, as it will expire shortly for your security.

---
Security Reminder:
If you did NOT request this code, please immediately disregard this email. Do not share this OTP with anyone, as it grants access to your account verification process.
---

Thank you,
The Interview.ai Security Team
`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: emailSubject, 
    text: emailBody, 
  });
};




// -------------------------------------------------------------------
// 3. AUTHENTICATE MIDDLEWARE (VERIFIES CUSTOM JWT)
// Used for ALL protected routes EXCEPT /login
// -------------------------------------------------------------------
async function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: "No session token provided." });
    }
    
    try {
        // Verify the custom JWT signed with your JWT_SECRET
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        
        // Pass the UID to the next route handler (e.g., /profile)
        req.firebaseUser = { uid: decoded.uid }; 
        next();
    } catch (err) {
        console.error("Custom JWT Verification Failed:", err.message);
        return res.status(401).json({ error: "Invalid or expired session token." });
    }
}


// -------------------------------------------------------------------
// 4. ROUTES
// -------------------------------------------------------------------

// POST /register
// Expects form data + Firebase-generated UID from the client.
router.post("/register", async (req, res) => {
    try {
        // Must contain all fields, including UID from Firebase.
        const { username, email, password, usertype, uid } = req.body;
        
        // Basic Check for all required fields (uid is often forgotten)
        if (!username || !email || !password || !usertype || !uid) {
             console.error("Registration Error: Missing one or more required fields.");
             return res.status(400).json({ error: "Missing required registration fields (username, email, password, usertype, or uid)." });
        }

        // 1. Hashing password for MongoDB
        const hashedPassword = await bcrypt.hash(password, 10); 
        
        // 2. Generate and store OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        // 3. Create the user in MongoDB
        const user = new User({
            username,
            uid, // IMPORTANT: The unique Firebase User ID
            email,
            password: hashedPassword,
            usertype,
            otp,
            otpExpires,
        });

        await user.save();

        // 4. Send OTP (If this line fails, it's a 500 error due to environment or config)
        await sendOtpEmail(email, otp); 

        // 5. Respond with success
        res.json({ message: "Registration successful. OTP sent.", email: email });

    } catch (err) {
        // Log the error for server-side debugging
        console.error("Backend Registration Error (500):", err);
        
        // Handle MongoDB duplication errors (username/email unique fields)
        if (err.code === 11000) {
            return res.status(409).json({ error: "Username or email already exists." });
        }
        
        // Return a generic 500 error for all other crashes (DB connection, Nodemailer crash, etc.)
        res.status(500).json({ error: "Internal Server Error during registration. Check server console for details." });
    }
});



// POST /login (NO AUTHENTICATE MIDDLEWARE)
// Expects UID from client after client-side Firebase Auth.
router.post("/login", async (req, res) => {
    // Client sends the UID obtained after a successful Firebase login.
    const { uid } = req.body; 

    if (!uid) {
        return res.status(400).json({ error: "Missing required UID." });
    }

    try {
        // Find user in MongoDB using the UID
        const user = await User.findOne({ uid: uid });

        if (!user) {
            return res.status(404).json({ error: "User not found in database. Please register." });
        }
        
        // Create your custom JWT (Session Token)
        const token = jwt.sign(
            { id: user._id, uid: user.uid, usertype: user.usertype },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Send the custom JWT back to the client
        // CORRECTED RESPONSE:
res.json({ 
    token, 
    message: "Login Successful",
    userId: user._id // <--- ADD THIS LINE (Sends the MongoDB ID)
});

    } catch (err) {
        console.error("Server Login Error:", err);
        res.status(500).json({ error: "Server error during session creation." });
    }
});


// POST /verify-otp
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Clear OTP fields
    user.otp = null;
    user.otpExpires = null;
    await user.save();
    
    // ISSUE JWT AFTER SUCCESSFUL VERIFICATION (optional, but good practice)
    const token = jwt.sign(
        { id: user._id, uid: user.uid, usertype: user.usertype },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.json({ message: "OTP Verified!", token: token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /profile (Protected: requires custom JWT)
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.firebaseUser.uid }).select('-password -otp -otpExpires -__v');
    
    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    res.json(user);
  } catch (err) {
    console.error("GET Profile Error:", err);
    res.status(500).json({ error: "Failed to fetch user profile." });
  }
});


// PUT /profile (Protected: requires custom JWT)
router.put('/profile', authenticate, async (req, res) => {
  const { username, email, newPassword } = req.body;
  const firebaseUid = req.firebaseUser.uid;

  try {
    // 1. Prepare updates for MongoDB
    const mongoUpdate = {};
    if (username) mongoUpdate.username = username;
    if (email) mongoUpdate.email = email; 

    // 2. Update MongoDB (Username and Email)
    if (Object.keys(mongoUpdate).length > 0) {
      await User.updateOne({ uid: firebaseUid }, { $set: mongoUpdate });
    }

    // 3. Handle Password Update (Firebase Auth)
    if (newPassword) {
      // Use Firebase Admin SDK to update the password in Firebase Auth
      await admin.auth().updateUser(firebaseUid, { password: newPassword });
    }

    // 4. Send Success Response
    res.json({ message: "Profile updated successfully." });

  } catch (err) {
    console.error("PUT Profile Error:", err);
    if (err.code === 11000) {
      return res.status(409).json({ error: "Username or Email is already taken." });
    }
    res.status(500).json({ error: "Failed to update profile." });
  }
});


router.post('/generate', async (req, res) => {
    try {
        const { interviewerId, interviewDate, startTime, data } = req.body;

        // Extract emails from the uploaded CSV data
        const candidateEmails = data && data.length > 0 
            ? data.map(row => row.email).filter(email => email) // Extract and filter out empty emails
            : [];

        // Validate that we have at least one email
        if (candidateEmails.length === 0) {
            return res.status(400).json({ 
                message: 'Please upload a CSV file with at least one valid email address.' 
            });
        }

        // 1. Create a new schedule document
        const newSchedule = new InterviewSchedule({
            interviewerId, // This links the session back to the HR/Company
            scheduledDate: interviewDate,
            startTime,
            
            candidateEmails: candidateEmails, // Store emails as array
            status: 'Scheduled'
        });

        // 2. Save to MongoDB
        const savedSchedule = await newSchedule.save();

        // 3. Send the unique ID back to the frontend
        res.status(201).json({ 
            message: 'Link generated successfully',
            sessionId: savedSchedule._id,
            candidatesCount: candidateEmails.length // Optional: send back count for confirmation
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating interview link.' });
    }
});
// ✅ CHECK SESSION EMAIL
const mongoose = require("mongoose");

router.get("/check_session/:sessionId/:email", async (req, res) => {
  try {
    const { sessionId, email } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ emailExists: false, message: "Invalid sessionId" });
    }

    const session = await InterviewSchedule.findById(sessionId);
    if (!session) return res.json({ emailExists: false });

    const emailExists = session.candidateEmails.includes(email.toLowerCase());

    return res.json({ emailExists, interviewerId: session.interviewerId , startTime: session.startTime, scheduledDate: session.scheduledDate});

  } catch (error) {
    console.error("Check session error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.get("/check_session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid sessionId" });
    }
    const session = await InterviewSchedule.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
    return res.json({ interviewerId: session.interviewerId , startTime: session.startTime, scheduledDate: session.scheduledDate});
  } catch (error) {
    console.error("Check session error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/create-report", async (req, res) => {
  try {
    const { sessionId, interviewerId, name, email } = req.body;

    // if (!sessionId || !interviewerId  || !email) {
    //   return res.status(400).json({ success: false, message: "Missing required fields" });
    // }

    const report = new FinalReport({
      sessionId,
      interviewerId,
      
      candidate_overview: {
        name,
        email,
        
      }
    });

    await report.save();

    res.status(201).json({
      success: true,
      message: "Report created successfully",
      reportId: report._id
    });

  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;