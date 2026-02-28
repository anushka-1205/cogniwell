import express from "express";
import authUser from "../middlewares/authUser.js";
import { recordSession } from "../controllers/gamesessionController.js";

const router = express.Router();

router.post("/record", authUser, recordSession);

export default router;
