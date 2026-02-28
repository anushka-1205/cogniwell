import express from "express";
import { register, login, isAuth, logout, }
from "../controllers/caregiverController.js";
import authCaregiver from "../middlewares/authCaregiver.js";

const caregiverRouter = express.Router();

caregiverRouter.post("/register", register);
caregiverRouter.post("/login", login);
caregiverRouter.get("/is-auth", authCaregiver, isAuth);
caregiverRouter.get("/logout", authCaregiver, logout);

export default caregiverRouter;
