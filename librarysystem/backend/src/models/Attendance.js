import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    branch: { type: String, required: true, trim: true },
    dateKey: { type: String, required: true, trim: true },
    checkInAt: { type: Date, required: true },
    checkOutAt: { type: Date },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
