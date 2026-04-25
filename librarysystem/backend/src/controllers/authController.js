import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

const userPayload = (user) => ({
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

export const registerStudent = async (req, res) => {
  const { name, email, password, branch } = req.body;
  if (!name || !email || !password || !branch) {
    return res.status(400).json({ message: "All fields are required." });
  }
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email already exists." });

  const user = await User.create({ name, email, password, branch, role: "student" });
  res.status(201).json({
    token: generateToken(user._id),
    user: userPayload(user),
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid credentials." });
  }
  res.json({
    token: generateToken(user._id),
    user: userPayload(user),
  });
};

export const me = async (req, res) => {
  res.json(userPayload(req.user));
};

export const updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found." });

  const { name, email, branch, password, branchAdminQrCodeId } = req.body;
  if (name) user.name = name;
  if (email) user.email = email;

  if (branch) {
    if (user.role === "student") {
      return res.status(400).json({ message: "Student branch cannot be changed." });
    }
    if (user.role !== "super_admin") {
      user.branch = branch;
    }
  }

  if (password) user.password = password;
  if (user.role === "branch_admin" && branchAdminQrCodeId !== undefined) {
    user.branchAdminQrCodeId = branchAdminQrCodeId;
  }

  const updated = await user.save();
  res.json(userPayload(updated));
};
