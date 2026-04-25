import User from "../models/User.js";

const sanitize = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  branch: user.branch,
  accessRestricted: user.accessRestricted,
  subscriptionExpiresAt: user.subscriptionExpiresAt,
  graceEndsAt: user.graceEndsAt,
  branchAdminQrCodeId: user.branchAdminQrCodeId,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const createBranchAdmin = async (req, res) => {
  const { name, email, password, branch } = req.body;
  if (!name || !email || !password || !branch) {
    return res.status(400).json({ message: "All fields are required." });
  }
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email already exists." });
  const user = await User.create({ name, email, password, branch, role: "branch_admin" });
  res.status(201).json(sanitize(user));
};

export const createStudentByAdmin = async (req, res) => {
  const { name, email, password, branch } = req.body;
  const effectiveBranch = req.user.role === "branch_admin" ? req.user.branch : branch;
  if (!name || !email || !password || !effectiveBranch) {
    return res.status(400).json({ message: "All fields are required." });
  }
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email already exists." });
  const user = await User.create({
    name,
    email,
    password,
    branch: effectiveBranch,
    role: "student",
  });
  res.status(201).json(sanitize(user));
};

export const getUsers = async (req, res) => {
  const query = {};
  if (req.query.role) query.role = req.query.role;
  if (req.query.branch && req.user.role === "super_admin") query.branch = req.query.branch;
  if (req.user.role === "branch_admin") query.branch = req.user.branch;
  const users = await User.find(query).select("-password").sort({ createdAt: -1 });
  res.json(users);
};
