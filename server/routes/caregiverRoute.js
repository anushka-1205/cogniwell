import express from "express";
import {
  register,
  login,
  isAuth,
  logout,
} from "../controllers/caregiverController.js";

const caregiverRouter = express.Router();

caregiverRouter.post("/register", register);
caregiverRouter.post("/login", login);
caregiverRouter.get("/is-auth", isAuth);
caregiverRouter.get("/logout", logout);

export default caregiverRouter;
