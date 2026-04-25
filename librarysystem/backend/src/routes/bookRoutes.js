import express from "express";
import {
  createBook,
  deleteBook,
  getBooks,
  updateBook,
} from "../controllers/bookController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/", getBooks);
router.post("/", authorize("super_admin", "branch_admin"), createBook);
router.put("/:id", authorize("super_admin", "branch_admin"), updateBook);
router.delete("/:id", authorize("super_admin", "branch_admin"), deleteBook);

export default router;
