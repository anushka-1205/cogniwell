import GameSession from "../models/GameSession.js";
import Caregiver from "../models/Caregiver.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import "dotenv/config";

export const recordSession = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { diseaseType, mode, result, metrics } = req.body;

    const session = await GameSession.create({
      user: userId,
      diseaseType,
      mode,
      result,
      metrics,
    });

    res.json({ success: true, session });
  } catch (error) {
    console.error(" recordSession error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
