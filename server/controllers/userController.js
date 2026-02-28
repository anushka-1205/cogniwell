import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Caregiver from "../models/Caregiver.js";
import User from "../models/User.js";
import 'dotenv/config';

// Register Elder: /api/user/register
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      age,
      gender,
      caregiverEmail,
      parkinsons,
      dementia,
      vision,
    } = req.body;

    if (!name || !email || !password || !age || !gender) {
      return res.json({ success: false, message: "Missing required details" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let caregiverRef = null;

    if (caregiverEmail) {
      const caregiver = await Caregiver.findOne({ email: caregiverEmail.toLowerCase() });
      if (caregiver) caregiverRef = caregiver._id;
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      age,
      gender,
      caregiver: caregiverRef,
      caregiverEmail: caregiverEmail?.toLowerCase() || null,
      d1: parkinsons === "yes",
      d2: dementia === "yes",
      d3: vision === "yes",
    });

    if (caregiverRef) {
      await Caregiver.findByIdAndUpdate(caregiverRef, { $addToSet: { elders: user._id } });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      domain: process.env.COOKIE_DOMAIN, 
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: caregiverRef
        ? "Registered and linked to caregiver"
        : "Registered (caregiver not yet linked)",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        caregiverLinked: !!caregiverRef,
        d1: user.d1,
        d2: user.d2,
        d3: user.d3,
      },
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};


// Login Elder: /api/user/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.json({ success: false, message: "Email and password are required" });

    const user = await User.findOne({ email });
    if (!user) return res.json({ success: false, message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ success: false, message: "Invalid email or password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Check Auth: /api/user/is-auth
export const isAuth = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.json({ success: false, message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id)
      .select("-password")
      .populate("caregiver", "name email");
    return res.json({ success: true, user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Logout Elder (token-based)
export const logout = async (req, res) => {
  return res.json({ success: true, message: "Logged out (token cleared client-side)" });
};


// Update disease detection flags (e.g., after a game or screening result)
// /api/user/update-disease-status
// controllers/userController.js
export const updateDiseaseStatus = async (req, res) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.split(" ")[1]) {
      token = authHeader.split(" ")[1];
    }

    if (!token && req.cookies && req.cookies.caregiver_token) {
      token = req.cookies.caregiver_token;
    }

    if (!token) {
      console.log("[updateDiseaseStatus] No token provided");
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.log("[updateDiseaseStatus] Token verification failed:", err.message);
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    const userId = decoded.id;
    if (!userId) {
      console.log("[updateDiseaseStatus] Token decoded but no id present");
      return res.status(401).json({ success: false, message: "Invalid token payload" });
    }

    console.log("[updateDiseaseStatus] userId:", userId);
    console.log("[updateDiseaseStatus] body:", req.body);

    const { d1, d2, d3 } = req.body;
    const updateFields = {};
    if (typeof d1 === "boolean") updateFields.d1 = d1;
    if (typeof d2 === "boolean") updateFields.d2 = d2;
    if (typeof d3 === "boolean") updateFields.d3 = d3;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: "No boolean flags provided to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      message: "Disease status updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("[updateDiseaseStatus] error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};



