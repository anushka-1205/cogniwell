import Caregiver from "../models/Caregiver.js";
import User from "../models/User.js";
import GameSession from "../models/GameSession.js";

// GET /api/caregiver/elders
export const getElders = async (req, res) => {
  try {
    const caregiverId = req.caregiverId;

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
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

// GET /api/caregiver/elder/:elderId/sessions
export const getElderSessions = async (req, res) => {
  try {
    const caregiverId = req.caregiverId;
    const { elderId } = req.params;

    // Verify caregiver actually linked to this elder
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

    // Fetch all game sessions for this elder (both Parkinson & Dementia)
    const sessions = await GameSession.find({ user: elderId })
      .sort({ createdAt: -1 })
      .select("-__v")
      .lean();

    return res.json({ success: true, sessions });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};
