import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ["super_admin", "branch_admin", "student"],
      default: "student",
    },
    branch: {
      type: String,
      trim: true,
      required() {
        return this.role !== "super_admin";
      },
      immutable() {
        return this.role === "student" && !this.isNew;
      },
    },
    accessRestricted: { type: Boolean, default: false },
    subscriptionExpiresAt: { type: Date },
    graceEndsAt: { type: Date },
    lastExpiryNoticeAt: { type: Date },
    branchAdminQrCodeId: { type: String, trim: true },
  },
  { timestamps: true }
);

userSchema.pre("save", async function preSave() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = async function matchPassword(password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
