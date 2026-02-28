import jwt from "jsonwebtoken";
import Questionnaire from "../models/Questionnaire.js";
import Caregiver from "../models/Caregiver.js";
import User from "../models/User.js";
import 'dotenv/config';

const extractUserIdFromToken = (req) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.split(" ")[1]) token = authHeader.split(" ")[1];
    if (!token && req.cookies) token = req.cookies.token || req.cookies.caregiver_token || null;
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded?.id || null;
  } catch (err) {
    console.warn("[extractUserIdFromToken] token error:", err.message);
    return null;
  }
};

export const submitQuestionnaire = async (req, res, next) => {
  try {
    const tokenUserId = extractUserIdFromToken(req);
    const userId = tokenUserId || req.body.userId;
    if (!userId) return res.status(400).json({ message: "Missing userId" });

    const {
      height,
      weight,
      bloodPressure,
      heartRate,
      breathsPerMin,
      physicalActivity,
      sleepHours,
      stressLevel,
      caregiverId,
    } = req.body;

    if (!height || !weight || !breathsPerMin) {
      return res.status(400).json({ message: "height, weight and breathsPerMin are required" });
    }

    const h = Number(height);
    const w = Number(weight);
    const breaths = Number(breathsPerMin);
    const hr = heartRate ? Number(heartRate) : undefined;
    const sleep = sleepHours ? Number(sleepHours) : undefined;
    const stress = stressLevel ? Number(stressLevel) : undefined;

    if (Number.isNaN(h) || Number.isNaN(w) || Number.isNaN(breaths)) {
      return res.status(400).json({ message: "height, weight and breathsPerMin must be numbers" });
    }

    const q = new Questionnaire({
      user: userId,
      caregiver: caregiverId || undefined,
      height: h,
      weight: w,
      bloodPressure: bloodPressure || undefined,
      heartRate: hr,
      breathsPerMin: breaths,
      physicalActivity: physicalActivity || undefined,
      sleepHours: sleep,
      stressLevel: stress || 3,
      raw: req.body,
    });

    await q.save();

    return res.status(201).json({ message: "Saved", questionnaire: q });
  } catch (error) {
    console.error("[submitQuestionnaire] error:", error);
    return next(error);
  }
};

export const getQuestionnairesForUser = async (req, res, next) => {
  try {
    const paramUserId = req.params.userId;
    const tokenUserId = extractUserIdFromToken(req);
    const userId = paramUserId || tokenUserId;
    if (!userId) return res.status(400).json({ message: "Missing userId" });

    const results = await Questionnaire.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("caregiver", "name email");

    return res.json({ questionnaires: results });
  } catch (err) {
    console.error("[getQuestionnairesForUser] error:", err);
    return next(err);
  }
};

export const getQuestionnaireById = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: "Missing id" });

    const q = await Questionnaire.findById(id)
      .populate("user", "name email")
      .populate("caregiver", "name email");

    if (!q) return res.status(404).json({ message: "Not found" });

    return res.json({ questionnaire: q });
  } catch (err) {
    console.error("[getQuestionnaireById] error:", err);
    return next(err);
  }
};
