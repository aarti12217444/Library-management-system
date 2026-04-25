import Message from "../models/Message.js";
import User from "../models/User.js";
import { emitToRoom } from "../services/socket.js";

const inboxQueryFor = (user) => {
  if (user.role === "super_admin") {
    return {
      recipientRole: "super_admin",
      $or: [{ recipientUser: user._id }, { recipientUser: { $exists: false } }],
    };
  }
  if (user.role === "branch_admin") {
    return {
      recipientRole: "branch_admin",
      branch: user.branch,
      $or: [{ recipientUser: user._id }, { recipientUser: { $exists: false } }],
    };
  }
  return { recipientRole: "student", recipientUser: user._id, branch: user.branch };
};

export const getInbox = async (req, res) => {
  const messages = await Message.find(inboxQueryFor(req.user))
    .populate("sender", "name email role branch")
    .sort({ createdAt: -1 });
  res.json(messages);
};

export const markRead = async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) return res.status(404).json({ message: "Message not found." });

  const isDirect = message.recipientUser ? String(message.recipientUser) === String(req.user._id) : true;
  const allowed =
    (req.user.role === "super_admin" && message.recipientRole === "super_admin" && isDirect) ||
    (req.user.role === "branch_admin" &&
      message.recipientRole === "branch_admin" &&
      message.branch === req.user.branch &&
      isDirect) ||
    (req.user.role === "student" &&
      message.recipientRole === "student" &&
      String(message.recipientUser) === String(req.user._id));

  if (!allowed) return res.status(403).json({ message: "Access denied." });

  if (!message.readBy.some((id) => String(id) === String(req.user._id))) {
    message.readBy.push(req.user._id);
    await message.save();
  }
  res.json(message);
};

export const sendMessage = async (req, res) => {
  const { recipientRole, content, recipientUserId, recipientUserIds, selectAll, branch } = req.body;
  if (!recipientRole || !content) {
    return res.status(400).json({ message: "recipientRole and content are required." });
  }

  let targets = [];
  const singleTarget = recipientUserId ? [recipientUserId] : [];
  const manyTargets = Array.isArray(recipientUserIds) ? recipientUserIds : [];
  const mergedTargets = [...new Set([...singleTarget, ...manyTargets].filter(Boolean))];

  if (req.user.role === "super_admin") {
    if (recipientRole !== "branch_admin") {
      return res.status(403).json({ message: "Super Admin can message only Branch Admins." });
    }
    const query = { role: "branch_admin" };
    if (branch) query.branch = branch;
    if (!selectAll && mergedTargets.length === 0) {
      return res.status(400).json({ message: "Select at least one Branch Admin or use Select All." });
    }
    if (selectAll) {
      targets = await User.find(query).select("_id branch");
    } else {
      targets = await User.find({ ...query, _id: { $in: mergedTargets } }).select("_id branch");
    }
  } else if (req.user.role === "branch_admin") {
    if (recipientRole === "super_admin") {
      if (!selectAll && mergedTargets.length === 0) {
        return res.status(400).json({ message: "Select at least one Super Admin or use Select All." });
      }
      if (selectAll) {
        targets = await User.find({ role: "super_admin" }).select("_id branch");
      } else {
        targets = await User.find({ role: "super_admin", _id: { $in: mergedTargets } }).select("_id branch");
      }
    } else if (recipientRole === "student") {
      const query = { role: "student", branch: req.user.branch };
      if (!selectAll && mergedTargets.length === 0) {
        return res.status(400).json({ message: "Select at least one student or use Select All." });
      }
      if (selectAll) {
        targets = await User.find(query).select("_id branch");
      } else {
        targets = await User.find({ ...query, _id: { $in: mergedTargets } }).select("_id branch");
      }
    } else {
      return res.status(403).json({ message: "Branch Admin can message only Super Admin or own-branch students." });
    }
  } else {
    return res.status(403).json({ message: "Students cannot send messages." });
  }

  if (targets.length === 0) {
    return res.status(400).json({ message: "No valid recipients found for this action." });
  }

  const documents = targets.map((target) => ({
    sender: req.user._id,
    senderRole: req.user.role,
    recipientRole,
    recipientUser: target._id,
    branch: recipientRole === "super_admin" ? undefined : target.branch,
    content,
    readBy: [],
  }));

  const created = await Message.insertMany(documents);
  const populated = await Message.find({ _id: { $in: created.map((m) => m._id) } })
    .populate("sender", "name email role branch")
    .sort({ createdAt: -1 });

  for (const msg of populated) {
    emitToRoom(`user:${String(msg.recipientUser)}`, "inbox:new", msg);
  }

  res.status(201).json({
    count: populated.length,
    messages: populated,
  });
};
