import GameSession from "../models/GameSession.js";
import Caregiver from "../models/Caregiver.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import "dotenv/config";

//  GET /api/caregiver/elders
export const getElders = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const caregiverId = decoded.id;

    const caregiver = await Caregiver.findById(caregiverId).populate(
      "elders",
      "name email age gender d1 d2 d3"
    );

    if (!caregiver) {
      return res.json({ success: false, message: "Caregiver not found" });
    }

    return res.json({
      success: true,
      elders: caregiver.elders,
    });
  } catch (error) {
    console.error(" getElders error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

//  GET /api/caregiver/elder/:elderId/sessions
export const getElderSessions = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const caregiverId = decoded.id;

    const { elderId } = req.params;
    const caregiver = await Caregiver.findById(caregiverId);

    if (!caregiver) {
      return res.json({ success: false, message: "Caregiver not found" });
    }

    if (!caregiver.elders.includes(elderId)) {
      return res.json({
        success: false,
        message: "Not authorized to view this elder's data",
      });
    }

    const sessions = await GameSession.find({ user: elderId })
      .sort({ createdAt: -1 })
      .select("-__v")
      .lean();

    return res.json({ success: true, sessions });
  } catch (error) {
    console.error(" getElderSessions error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
