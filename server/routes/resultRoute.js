import express from "express";
import authCaregiver from "../middlewares/authCaregiver.js";
import {
  getElders,
  getElderSessions,
} from "../controllers/resultController.js";

const router = express.Router();

router.get("/elders", authCaregiver, getElders);
router.get("/elder/:elderId/sessions", authCaregiver, getElderSessions);

export default router;
