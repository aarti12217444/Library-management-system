import crypto from "crypto";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import { getRazorpayClient } from "../services/razorpay.js";
import { createNotification } from "../services/notificationService.js";

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const addMonth = (date) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  return d;
};

const applySuccessfulPayment = async ({ payment, razorpayPaymentId, razorpaySignature, paidAt }) => {
  if (payment.status === "paid") return payment;

  const student = await User.findById(payment.student).select("name subscriptionExpiresAt accessRestricted lastExpiryNoticeAt graceEndsAt");
  if (!student) throw new Error("Student record missing for payment.");

  const now = paidAt || new Date();
  const base = student.subscriptionExpiresAt && student.subscriptionExpiresAt > now ? student.subscriptionExpiresAt : now;
  const nextExpiry = addMonth(base);
  const graceEndsAt = addDays(nextExpiry, 10);

  payment.status = "paid";
  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = razorpaySignature;
  payment.paidAt = now;
  payment.expiresAtAfterPayment = nextExpiry;
  await payment.save();

  student.subscriptionExpiresAt = nextExpiry;
  student.graceEndsAt = graceEndsAt;
  student.accessRestricted = false;
  student.lastExpiryNoticeAt = null;
  await student.save();

  await createNotification({
    recipientId: payment.student,
    title: "Payment received",
    body: `Your subscription is active until ${nextExpiry.toDateString()}.`,
    type: "payment",
    meta: { paymentId: payment._id },
  });

  if (payment.branchAdmin) {
    await createNotification({
      recipientId: payment.branchAdmin,
      title: "Branch payment confirmed",
      body: `${student.name} completed payment via your branch QR flow.`,
      type: "payment",
      meta: { paymentId: payment._id, studentId: payment.student },
    });
  }

  return payment;
};

export const listPayments = async (req, res) => {
  const query = {};
  if (req.query.studentId) query.student = req.query.studentId;
  const payments = await Payment.find(query)
    .populate("student", "name email branch")
    .populate("branchAdmin", "name email branch")
    .sort({ createdAt: -1 });
  res.json(payments);
};

export const createPaymentOrder = async (req, res) => {
  const { studentId, amount, branchAdminId, notes } = req.body;
  if (!studentId || !amount) return res.status(400).json({ message: "studentId and amount are required." });

  const student = await User.findById(studentId);
  if (!student || student.role !== "student") return res.status(400).json({ message: "Invalid student." });

  let branchAdmin = null;
  if (branchAdminId) {
    branchAdmin = await User.findById(branchAdminId);
    if (!branchAdmin || branchAdmin.role !== "branch_admin" || branchAdmin.branch !== student.branch) {
      return res.status(400).json({ message: "Branch admin must belong to student's branch." });
    }
  }

  const razorpay = getRazorpayClient();
  if (!razorpay) return res.status(500).json({ message: "Razorpay keys are not configured." });

  const order = await razorpay.orders.create({
    amount: Math.round(Number(amount) * 100),
    currency: "INR",
    notes: {
      studentId: String(student._id),
      branch: student.branch,
      branchAdminId: branchAdmin ? String(branchAdmin._id) : "",
      ...(notes || {}),
    },
  });

  const payment = await Payment.create({
    student: student._id,
    branch: student.branch,
    branchAdmin: branchAdmin ? branchAdmin._id : undefined,
    amount: Number(amount),
    status: "created",
    razorpayOrderId: order.id,
  });

  res.status(201).json({
    paymentId: payment._id,
    orderId: order.id,
    amount: payment.amount,
    currency: payment.currency,
    key: process.env.RAZORPAY_KEY_ID,
  });
};

export const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: "Missing razorpay verification data." });
  }
  if (!process.env.RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ message: "Razorpay secret is not configured." });
  }

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expected !== razorpay_signature) return res.status(400).json({ message: "Invalid payment signature." });

  const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
  if (!payment) return res.status(404).json({ message: "Payment record not found." });

  const updated = await applySuccessfulPayment({
    payment,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
    paidAt: new Date(),
  });

  res.json({ message: "Payment verified successfully.", payment: updated });
};

export const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) return res.status(500).json({ message: "Webhook secret not configured." });

    const signature = req.headers["x-razorpay-signature"];
    if (!signature) return res.status(400).json({ message: "Missing webhook signature." });

    const rawBody = req.body;
    const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    if (expected !== signature) return res.status(400).json({ message: "Invalid webhook signature." });

    const event = JSON.parse(rawBody.toString("utf8"));
    if (event.event !== "payment.captured") {
      return res.json({ message: "Webhook received (ignored non-captured event)." });
    }

    const entity = event.payload?.payment?.entity;
    if (!entity?.order_id || !entity?.id) return res.status(400).json({ message: "Invalid webhook payload." });

    const payment = await Payment.findOne({ razorpayOrderId: entity.order_id });
    if (!payment) return res.json({ message: "No local payment record for this order." });

    await applySuccessfulPayment({
      payment,
      razorpayPaymentId: entity.id,
      razorpaySignature: signature,
      paidAt: entity.created_at ? new Date(entity.created_at * 1000) : new Date(),
    });

    res.json({ message: "Webhook processed successfully." });
  } catch (error) {
    console.error("Webhook processing failed:", error.message);
    res.status(500).json({ message: "Webhook processing failed." });
  }
};
