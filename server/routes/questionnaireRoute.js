import express from "express";
import { submitQuestionnaire, getQuestionnairesForUser, getQuestionnaireById } from "../controllers/questionnaireController.js";

const router = express.Router();

router.post("/", submitQuestionnaire);
router.get("/user/:userId", getQuestionnairesForUser);
router.get("/:id", getQuestionnaireById);

export default router;