import Book from "../models/Book.js";
import Loan from "../models/Loan.js";

export const borrowBook = async (req, res) => {
  const book = await Book.findById(req.params.bookId);
  if (!book) return res.status(404).json({ message: "Book not found." });
  if (book.availableCopies < 1) return res.status(400).json({ message: "No available copies." });

  if (req.user.branch !== book.branch) {
    return res.status(403).json({ message: "You can borrow only from your branch." });
  }

  const existing = await Loan.findOne({
    book: book._id,
    student: req.user._id,
    status: "borrowed",
  });
  if (existing) return res.status(400).json({ message: "You already borrowed this book." });

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);

  const loan = await Loan.create({
    book: book._id,
    student: req.user._id,
    branch: book.branch,
    dueDate,
  });

  book.availableCopies -= 1;
  await book.save();
  res.status(201).json(loan);
};

export const returnBook = async (req, res) => {
  const loan = await Loan.findOne({
    _id: req.params.loanId,
    student: req.user._id,
    status: "borrowed",
  });
  if (!loan) return res.status(404).json({ message: "Active loan not found." });

  const book = await Book.findById(loan.book);
  if (book) {
    book.availableCopies += 1;
    await book.save();
  }

  loan.status = "returned";
  loan.returnedAt = new Date();
  await loan.save();

  res.json(loan);
};

export const getLoans = async (req, res) => {
  const query = {};
  if (req.user.role === "student") query.student = req.user._id;
  if (req.user.role === "branch_admin") query.branch = req.user.branch;

  const loans = await Loan.find(query)
    .populate("book", "title author isbn branch")
    .populate("student", "name email branch")
    .sort({ createdAt: -1 });

  res.json(loans);
};
