import Caregiver from "../models/Caregiver.js";
import User from "../models/User.js";
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

    const caregiver = await Caregiver.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
    });

    const pendingElders = await User.find({ caregiverEmail: email.toLowerCase() });

    if (pendingElders.length > 0) {
      const elderIds = pendingElders.map((elder) => elder._id);

      caregiver.elders.push(...elderIds);
      await caregiver.save();

      await User.updateMany(
        { caregiverEmail: email.toLowerCase() },
        { $set: { caregiver: caregiver._id } }
      );
    }

    const token = jwt.sign({ id: caregiver._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.cookie("caregiver_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      domain: process.env.COOKIE_DOMAIN, 
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
    if (!email || !password)
      return res.json({ success: false, message: "Email and password are required" });

    const caregiver = await Caregiver.findOne({ email: email.toLowerCase() });
    if (!caregiver) return res.json({ success: false, message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, caregiver.password);
    if (!isMatch) return res.json({ success: false, message: "Invalid email or password" });

    const token = jwt.sign({ id: caregiver._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      success: true,
      token,
      caregiver: {
        id: caregiver._id,
        name: caregiver.name,
        email: caregiver.email,
      },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Check Auth
export const isAuth = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.json({ success: false, message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const caregiver = await Caregiver.findById(decoded.id)
      .select("-password")
      .populate("elders", "name email age gender d1 d2 d3");
    return res.json({ success: true, caregiver });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Logout Caregiver
export const logout = async (req, res) => {
  return res.json({ success: true, message: "Logged out (token cleared client-side)" });
};

