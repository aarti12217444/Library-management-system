import express from "express";
import {
  createBranchAdmin,
  createStudentByAdmin,
  getUsers,
} from "../controllers/userController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.get("/", authorize("super_admin", "branch_admin"), getUsers);
router.post("/branch-admin", authorize("super_admin"), createBranchAdmin);
router.post("/student", authorize("super_admin", "branch_admin"), createStudentByAdmin);

export default router;
