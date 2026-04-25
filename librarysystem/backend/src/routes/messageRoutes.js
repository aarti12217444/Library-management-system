import express from "express";
import { getInbox, markRead, sendMessage } from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.get("/inbox", getInbox);
router.post("/send", sendMessage);
router.patch("/:id/read", markRead);

export default router;
