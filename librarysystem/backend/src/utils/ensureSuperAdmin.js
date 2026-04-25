import User from "../models/User.js";

const ensureSuperAdmin = async () => {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME || "Super Admin";

  if (!email || !password) return;

  const existing = await User.findOne({ email });
  if (existing) return;

  await User.create({
    name,
    email,
    password,
    role: "super_admin",
  });

  console.log(`Seeded default super admin: ${email}`);
};

export default ensureSuperAdmin;
