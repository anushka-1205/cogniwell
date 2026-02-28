import mongoose from "mongoose";

const questionnaireSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    caregiver: { type: mongoose.Schema.Types.ObjectId, ref: "Caregiver" },

    height: { type: Number, required: true },
    weight: { type: Number, required: true },
    bloodPressure: { type: String },
    heartRate: { type: Number },
    breathsPerMin: { type: Number },
    physicalActivity: { type: String, enum: ["Sedentary", "Moderate", "Active"] },
    sleepHours: { type: Number },
    stressLevel: { type: Number, min: 1, max: 5, default: 3 },

    bmi: { type: Number },
    bmiStatus: { type: String },

    raw: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true, minimize: false }
);

questionnaireSchema.pre("save", function (next) {
  try {
    if (this.height && this.weight) {
      const hMeters = this.height / 100;
      const bmiVal = this.weight / (hMeters * hMeters);
      this.bmi = Math.round(bmiVal * 10) / 10;
      if (this.bmi < 18.5) this.bmiStatus = "Underweight";
      else if (this.bmi >= 18.5 && this.bmi < 25) this.bmiStatus = "Normal";
      else this.bmiStatus = "Overweight";
    }
  } catch (e) {
  }
  next();
});

const Questionnaire = mongoose.models.Questionnaire || mongoose.model("Questionnaire", questionnaireSchema);

export default Questionnaire;
