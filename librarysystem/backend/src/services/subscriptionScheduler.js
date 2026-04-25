import cron from "node-cron";
import User from "../models/User.js";
import { createNotification } from "./notificationService.js";

const MS_IN_DAY = 24 * 60 * 60 * 1000;

const runSubscriptionSweep = async () => {
  const now = new Date();
  const students = await User.find({ role: "student" });

  for (const student of students) {
    if (!student.subscriptionExpiresAt) continue;

    const expiry = new Date(student.subscriptionExpiresAt);
    const graceEnds = student.graceEndsAt ? new Date(student.graceEndsAt) : new Date(expiry.getTime() + 10 * MS_IN_DAY);
    const daysToExpiry = Math.ceil((expiry.getTime() - now.getTime()) / MS_IN_DAY);

    const shouldWarn = daysToExpiry <= 3 && daysToExpiry >= 0;
    const warnedToday =
      student.lastExpiryNoticeAt &&
      new Date(student.lastExpiryNoticeAt).toDateString() === now.toDateString();

    if (shouldWarn && !warnedToday) {
      await createNotification({
        recipientId: student._id,
        title: "Subscription ending soon",
        body: `Your plan is ending on ${expiry.toDateString()}. Complete payment within 10 days after expiry to avoid access restriction.`,
        type: "subscription",
      });
      student.lastExpiryNoticeAt = now;
    }

    if (now > graceEnds && !student.accessRestricted) {
      student.accessRestricted = true;
      await createNotification({
        recipientId: student._id,
        title: "Access restricted",
        body: "Your grace period has ended. Please complete payment to restore library access.",
        type: "subscription",
      });
    }

    await student.save();
  }
};

export const startSubscriptionScheduler = () => {
  cron.schedule("*/30 * * * *", async () => {
    try {
      await runSubscriptionSweep();
    } catch (error) {
      console.error("Subscription scheduler failed:", error.message);
    }
  });
};

export { runSubscriptionSweep };
