import express from "express";
import authCaregiver from "../middlewares/authCaregiver.js";
import {
  getElders,
  getElderSessions,
} from "../controllers/resultController.js";

const router = express.Router();

router.get("/elders", getElders);
router.get("/elder/:elderId/sessions", getElderSessions);

export default router;
