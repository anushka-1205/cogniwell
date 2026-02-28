import express from "express";
import {
  register,
  login,
  isAuth,
  logout,
  updateDiseaseStatus,
} from "../controllers/userController.js";

const userRouter = express.Router();
userRouter.post("/register", register);
userRouter.post("/login", login);
userRouter.get("/is-auth", isAuth);
userRouter.get("/logout", logout);
userRouter.put("/update-disease-status", updateDiseaseStatus);

export default userRouter;
