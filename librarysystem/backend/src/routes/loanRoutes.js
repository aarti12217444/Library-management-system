import express from "express";
import { borrowBook, getLoans, returnBook } from "../controllers/loanController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.get("/", getLoans);
router.post("/borrow/:bookId", authorize("student"), borrowBook);
router.patch("/return/:loanId", authorize("student"), returnBook);

export default router;
