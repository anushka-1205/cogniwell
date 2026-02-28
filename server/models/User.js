import mongoose from "mongoose";
import Caregiver from "./Caregiver.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    age: { type: Number, required: true, min: 1 },
    gender: { type: String, required: true, enum: ["Male", "Female", "Other"] },
    d1: { type: Boolean, default: false },
    d2: { type: Boolean, default: false },
    d3: { type: Boolean, default: false },
    caregiver: { type: mongoose.Schema.Types.ObjectId, ref: "Caregiver" },
    caregiverEmail: { type: String, lowercase: true },
  },
  { timestamps: true, minimize: false }
);

userSchema.post("findOneAndDelete", async function (doc) {
  if (doc?._id) {
    try {
      await Caregiver.updateMany(
        { elders: doc._id },
        { $pull: { elders: doc._id } }
      );
      await GameSession.deleteMany({ user: doc._id });
    } catch (error) {
      console.error("Error cleaning up after user deletion:", error.message);
    }
  }
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
