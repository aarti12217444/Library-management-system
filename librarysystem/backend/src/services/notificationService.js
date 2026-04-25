import Notification from "../models/Notification.js";
import { emitToRoom } from "./socket.js";

export const createNotification = async ({ recipientId, title, body, type = "system", meta = {} }) => {
  const notification = await Notification.create({
    recipient: recipientId,
    title,
    body,
    type,
    meta,
  });
  emitToRoom(`user:${String(recipientId)}`, "notification:new", notification);
  return notification;
};
