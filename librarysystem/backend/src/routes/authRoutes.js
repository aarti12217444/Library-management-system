import express from "express";
import { login, me, registerStudent, updateProfile } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerStudent);
router.post("/login", login);
router.get("/me", protect, me);
router.put("/profile", protect, updateProfile);

export default router;
