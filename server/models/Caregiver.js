import mongoose from "mongoose";

const caregiverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String },
    elders: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true, minimize: false }
);

const Caregiver = mongoose.models.Caregiver || mongoose.model("Caregiver", caregiverSchema);

export default Caregiver;
