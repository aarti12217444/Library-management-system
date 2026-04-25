import mongoose from "mongoose";

const loanSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    branch: { type: String, required: true, trim: true },
    status: { type: String, enum: ["borrowed", "returned"], default: "borrowed" },
    dueDate: { type: Date, required: true },
    returnedAt: { type: Date },
  },
  { timestamps: true }
);

const Loan = mongoose.model("Loan", loanSchema);
export default Loan;
