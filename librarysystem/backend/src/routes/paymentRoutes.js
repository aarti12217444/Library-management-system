import express from "express";
import {
  createPaymentOrder,
  listPayments,
  verifyPayment,
} from "../controllers/paymentController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/", authorize("super_admin"), listPayments);
router.post("/order", authorize("super_admin"), createPaymentOrder);
router.post("/verify", authorize("super_admin"), verifyPayment);

export default router;
