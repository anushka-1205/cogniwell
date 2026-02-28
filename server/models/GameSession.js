import mongoose from "mongoose";

const gameSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    diseaseType: { 
      type: String, 
      enum: ["parkinson", "dementia", "vision"], 
      required: true 
    },
    mode: { 
      type: String, 
      enum: ["detection", "therapy"], 
      required: true 
    },
    score: { type: Number }, // optional overall score if computed
    result: { type: String },
    duration: { type: Number }, // in seconds

    metrics: {
      // Parkinson fields
      parkinson: {
        tapsPerSecond: { type: Number },
        correctTaps: { type: Number },
        time: { type: Number },
      },

      // Dementia fields
      dementia: {
        correctAnswers: { type: Number },
        gridSize: { type: Number },
        time: { type: Number },
      },

      // vision fields
      vision: {
        correctAnswers: { type: Number },
        time: { type: Number },
      },
    },
  },
  { timestamps: true, minimize: false }
);

const GameSession =
  mongoose.models.GameSession || mongoose.model("GameSession", gameSessionSchema);

export default GameSession;
