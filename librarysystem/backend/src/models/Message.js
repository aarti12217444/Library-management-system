import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: {
      type: String,
      enum: ["super_admin", "branch_admin", "student"],
      required: true,
    },
    recipientRole: {
      type: String,
      enum: ["super_admin", "branch_admin", "student"],
      required: true,
    },
    branch: { type: String, trim: true },
    recipientUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, required: true, trim: true, maxlength: 1500 },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
