import User from "../models/User.js";
import Caregiver from "../models/Caregiver.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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

    // ✅ Convert yes/no to boolean and store
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

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
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
    const userId = req.userId;
    const user = await User.findById(userId).select("-password").populate("caregiver", "name email");
    return res.json({ success: true, user });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Logout Elder: /api/user/logout
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });
    return res.json({ success: true, message: "Logged out" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Update disease detection flags (e.g., after a game or screening result)
// /api/user/update-disease-status
export const updateDiseaseStatus = async (req, res) => {
  try {
    const userId = req.userId; // extracted from JWT middleware
    const { d1, d2, d3 } = req.body;

    const updateFields = {};
    if (typeof d1 === "boolean") updateFields.d1 = d1;
    if (typeof d2 === "boolean") updateFields.d2 = d2;
    if (typeof d3 === "boolean") updateFields.d3 = d3;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("-password");

    return res.json({
      success: true,
      message: "Disease status updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};


