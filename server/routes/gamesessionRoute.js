import express from "express";
import authUser from "../middlewares/authUser.js";
import { recordSession } from "../controllers/gamesessionController.js";

const router = express.Router();

router.post("/record", recordSession);

export default router;
