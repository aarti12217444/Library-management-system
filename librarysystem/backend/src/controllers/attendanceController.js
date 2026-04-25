import Attendance from "../models/Attendance.js";

const toDateKey = (date) => date.toISOString().slice(0, 10);

export const checkIn = async (req, res) => {
  if (req.user.accessRestricted) {
    return res.status(403).json({ message: "Access restricted due to unpaid subscription." });
  }
  const todayKey = toDateKey(new Date());
  const active = await Attendance.findOne({
    student: req.user._id,
    dateKey: todayKey,
    checkOutAt: { $exists: false },
  });
  if (active) {
    return res.status(400).json({ message: "You are already checked in." });
  }

  const record = await Attendance.create({
    student: req.user._id,
    branch: req.user.branch,
    dateKey: todayKey,
    checkInAt: new Date(),
    note: req.body.note || "",
  });

  res.status(201).json(record);
};

export const checkOut = async (req, res) => {
  if (req.user.accessRestricted) {
    return res.status(403).json({ message: "Access restricted due to unpaid subscription." });
  }
  const record = await Attendance.findOne({
    _id: req.params.id,
    student: req.user._id,
  });
  if (!record) return res.status(404).json({ message: "Attendance record not found." });
  if (record.checkOutAt) return res.status(400).json({ message: "Already checked out." });

  record.checkOutAt = new Date();
  await record.save();
  res.json(record);
};

export const getAttendance = async (req, res) => {
  const query = {};
  if (req.user.role === "student") query.student = req.user._id;
  if (req.user.role === "branch_admin") query.branch = req.user.branch;
  if (req.query.branch && req.user.role === "super_admin") query.branch = req.query.branch;

  const records = await Attendance.find(query)
    .populate("student", "name email branch")
    .sort({ checkInAt: -1 });

  res.json(records);
};
