import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { handleRazorpayWebhook } from "./controllers/paymentController.js";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import { setIO } from "./services/socket.js";
import { startSubscriptionScheduler } from "./services/subscriptionScheduler.js";
import ensureSuperAdmin from "./utils/ensureSuperAdmin.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), handleRazorpayWebhook);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Library Management API running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payments", paymentRoutes);

// Basic error handler for duplicate keys and unexpected failures.
app.use((err, _req, res, _next) => {
  if (err?.code === 11000) {
    return res.status(400).json({ message: "Duplicate value exists." });
  }
  console.error(err);
  res.status(500).json({ message: "Server error." });
});

const io = new Server(httpServer, {
  cors: { origin: FRONTEND_URL, methods: ["GET", "POST"] },
});
setIO(io);

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Unauthorized"));
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select("_id role branch");
    if (!user) return next(new Error("Unauthorized"));
    socket.user = user;
    next();
  } catch (_error) {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  const { _id, role, branch } = socket.user;
  socket.join(`user:${String(_id)}`);
  if (role === "super_admin") socket.join("role:super_admin");
  if (role === "branch_admin" && branch) socket.join(`role:branch_admin:${branch}`);
});

const start = async () => {
  await connectDB();
  await ensureSuperAdmin();
  startSubscriptionScheduler();
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

start();
