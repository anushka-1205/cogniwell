import Questionnaire from "../models/Questionnaire.js";


export const submitQuestionnaire = async (req, res, next) => {
  try {
    const userId = req.body.userId || req.user?.id; // prefer authenticated user (req.user)
    if (!userId) return res.status(400).json({ message: "Missing userId" });

    // pick fields from body
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

    // basic validation
    if (!height || !weight || !breathsPerMin) {
      return res.status(400).json({ message: "height, weight and breathsPerMin are required" });
    }

    const q = new Questionnaire({
      user: userId,
      caregiver: caregiverId,
      height: Number(height),
      weight: Number(weight),
      bloodPressure,
      heartRate: heartRate ? Number(heartRate) : undefined,
      breathsPerMin: Number(breathsPerMin),
      physicalActivity,
      sleepHours: sleepHours ? Number(sleepHours) : undefined,
      stressLevel: stressLevel ? Number(stressLevel) : 3,
      raw: req.body,
    });

    await q.save();

    // optionally link questionnaire to user or caregiver (if you maintain arrays)
    // await User.findByIdAndUpdate(userId, { $push: { questionnaires: q._id } });

    return res.status(201).json({ message: "Saved", questionnaire: q });
  } catch (error) {
    next(error);
  }
};

export const getQuestionnairesForUser = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user?.id;
    if (!userId) return res.status(400).json({ message: "Missing userId" });

    const results = await Questionnaire.find({ user: userId }).sort({ createdAt: -1 }).limit(50);
    return res.json({ questionnaires: results });
  } catch (err) {
    next(err);
  }
};

export const getQuestionnaireById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const q = await Questionnaire.findById(id).populate("user", "name email").populate("caregiver", "name email");
    if (!q) return res.status(404).json({ message: "Not found" });
    res.json({ questionnaire: q });
  } catch (err) {
    next(err);
  }
};
