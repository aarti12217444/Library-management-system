import express from "express";
import { checkIn, checkOut, getAttendance } from "../controllers/attendanceController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.get("/", getAttendance);
router.post("/check-in", authorize("student"), checkIn);
router.patch("/check-out/:id", authorize("student"), checkOut);

export default router;
