import Caregiver from "../models/Caregiver.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import 'dotenv/config';


// Register Caregiver: /api/caregiver/register
export const register = async (req, res) => {
  try {
    const { name, email, password, phone} = req.body;

    if (!name || !email || !password) {
      return res.json({ success: false, message: "Missing required details" });
    }

    const existingCaregiver = await Caregiver.findOne({ email: email.toLowerCase() });
    if (existingCaregiver) {
      return res.json({ success: false, message: "Caregiver already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 1: Create caregiver
    const caregiver = await Caregiver.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
    });

    // Step 2: Link elders who had this caregiverEmail pending
    const pendingElders = await User.find({ caregiverEmail: email.toLowerCase() });

    if (pendingElders.length > 0) {
      const elderIds = pendingElders.map((elder) => elder._id);

      // Update caregiver side
      caregiver.elders.push(...elderIds);
      await caregiver.save();

      // Update elder side
      await User.updateMany(
        { caregiverEmail: email.toLowerCase() },
        { $set: { caregiver: caregiver._id } }
      );
    }

    // Step 3: Generate JWT token
    const token = jwt.sign({ id: caregiver._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.cookie("caregiver_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message:
        pendingElders.length > 0
          ? `Registered and linked with ${pendingElders.length} elders`
          : "Registered successfully (no elders linked yet)",
      caregiver: {
        id: caregiver._id,
        name: caregiver.name,
        email: caregiver.email,
      },
    });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Login Caregiver: /api/caregiver/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: "Email and password are required" });
    }

    const caregiver = await Caregiver.findOne({ email: email.toLowerCase() });
    if (!caregiver) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, caregiver.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: caregiver._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.cookie("caregiver_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      caregiver: {
        id: caregiver._id,
        name: caregiver.name,
        email: caregiver.email,
      },
    });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Check Auth: /api/caregiver/is-auth
export const isAuth = async (req, res) => {
  try {
    const caregiverId = req.caregiverId;
    const caregiver = await Caregiver.findById(caregiverId)
      .select("-password")
      .populate("elders", "name email age gender d1 d2 d3");
    return res.json({ success: true, caregiver });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};



// Logout Caregiver: /api/caregiver/logout
export const logout = async (req, res) => {
  try {
    res.clearCookie("caregiver_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });
    return res.json({ success: true, message: "Logged out" });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};
