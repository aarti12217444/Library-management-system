import Book from "../models/Book.js";

export const getBooks = async (req, res) => {
  const query = {};
  if (req.user.role === "branch_admin" || req.user.role === "student") {
    query.branch = req.user.branch;
  }
  const books = await Book.find(query).sort({ createdAt: -1 });
  res.json(books);
};

export const createBook = async (req, res) => {
  const { title, author, isbn, totalCopies, branch } = req.body;
  const effectiveBranch = req.user.role === "branch_admin" ? req.user.branch : branch;

  if (!title || !author || !isbn || !totalCopies || !effectiveBranch) {
    return res.status(400).json({ message: "Please provide all required fields." });
  }

  const book = await Book.create({
    title,
    author,
    isbn,
    branch: effectiveBranch,
    totalCopies: Number(totalCopies),
    availableCopies: Number(totalCopies),
  });

  res.status(201).json(book);
};

export const updateBook = async (req, res) => {
  const { id } = req.params;
  const { title, author, isbn, totalCopies } = req.body;

  const book = await Book.findById(id);
  if (!book) {
    return res.status(404).json({ message: "Book not found." });
  }
  if (req.user.role === "branch_admin" && req.user.branch !== book.branch) {
    return res.status(403).json({ message: "Access denied for this branch." });
  }

  if (title) book.title = title;
  if (author) book.author = author;
  if (isbn) book.isbn = isbn;

  if (totalCopies !== undefined) {
    const nextTotal = Number(totalCopies);
    const borrowedCount = book.totalCopies - book.availableCopies;
    if (nextTotal < borrowedCount) {
      return res.status(400).json({
        message: "Total copies cannot be less than currently borrowed copies.",
      });
    }
    book.totalCopies = nextTotal;
    book.availableCopies = nextTotal - borrowedCount;
  }

  const updatedBook = await book.save();
  res.json(updatedBook);
};

export const deleteBook = async (req, res) => {
  const { id } = req.params;
  const book = await Book.findById(id);
  if (!book) {
    return res.status(404).json({ message: "Book not found." });
  }
  if (req.user.role === "branch_admin" && req.user.branch !== book.branch) {
    return res.status(403).json({ message: "Access denied for this branch." });
  }
  await book.deleteOne();
  res.json({ message: "Book deleted successfully." });
};
