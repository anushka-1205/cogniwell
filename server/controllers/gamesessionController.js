import GameSession from "../models/GameSession.js";

export const recordSession = async (req, res) => {
  try {
    const userId = req.userId;
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
    res.json({ success: false, message: error.message });
  }
};