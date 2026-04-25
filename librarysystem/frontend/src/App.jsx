import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import {
  animateEntry,
  animateStaggerIn,
  animateSuccess,
  attachButtonAnimations,
  attachFormFocusAnimations,
} from "./animations/uiAnimations";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
const roleLabel = { super_admin: "Super Admin", branch_admin: "Branch Admin", student: "Student" };

const createCaptcha = () => {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { prompt: `${a} + ${b}`, answer: String(a + b) };
};

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  const saveAuth = (payload) => {
    setToken(payload.token);
    setUser(payload.user);
    localStorage.setItem("token", payload.token);
    localStorage.setItem("user", JSON.stringify(payload.user));
  };

  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage mode="login" onSuccess={saveAuth} />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <AuthPage mode="register" onSuccess={saveAuth} />} />
      <Route path="/" element={token && user ? <Dashboard token={token} user={user} setUser={setUser} onLogout={logout} /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AuthPage({ mode, onSuccess }) {
  const isRegister = mode === "register";
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const successRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState(createCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", branch: "" });

  useEffect(() => {
    if (!pageRef.current) return;
    animateEntry(pageRef.current, { duration: 900 });
    animateStaggerIn(pageRef.current.querySelectorAll("[data-anim-field]"), { duration: 750 });
    const detachButtons = attachButtonAnimations(pageRef.current);
    const detachFocus = attachFormFocusAnimations(pageRef.current);
    return () => {
      detachButtons();
      detachFocus();
    };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (captchaInput.trim() !== captcha.answer) {
      setError("Captcha verification failed. Please solve correctly.");
      setCaptcha(createCaptcha());
      setCaptchaInput("");
      return;
    }

    setLoading(true);
    try {
      const endpoint = isRegister ? "/auth/register" : "/auth/login";
      const body = isRegister ? form : { email: form.email, password: form.password };
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Authentication failed.");

      if (successRef.current) animateSuccess(successRef.current);
      onSuccess(data);
      setTimeout(() => navigate("/"), 220);
    } catch (err) {
      setError(err.message);
      setCaptcha(createCaptcha());
      setCaptchaInput("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main ref={pageRef} className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-indigo-400/20 bg-slate-900/70 p-6 shadow-[0_20px_70px_rgba(79,70,229,0.45)] backdrop-blur">
        <div data-anim-field>
          <h1 className="text-2xl font-bold">{isRegister ? "Student Registration" : "Welcome Back"}</h1>
          <p className="mt-1 text-sm text-slate-300">Role Access: Student / Branch Admin / Super Admin</p>
        </div>
        <form onSubmit={submit} className="mt-4 space-y-3">
          {isRegister && <Input dataAnim label="Full Name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} dark />}
          <Input dataAnim label="Email" type="email" value={form.email} onChange={(v) => setForm((p) => ({ ...p, email: v }))} dark />
          <label data-anim-field className="block">
            <span className="mb-1 block text-sm text-slate-200">Password</span>
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                className="w-full rounded-lg border border-slate-500 bg-slate-800/80 px-3 py-2 pr-11 text-white outline-none focus:border-indigo-400"
              />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300">
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </label>
          {isRegister && <Input dataAnim label="Branch" value={form.branch} onChange={(v) => setForm((p) => ({ ...p, branch: v }))} dark />}

          <div data-anim-field className="rounded-lg border border-slate-600 bg-slate-800/80 p-3">
            <p className="text-xs text-slate-300">I am not a robot</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded bg-slate-700 px-2 py-1 text-sm text-white">Solve: {captcha.prompt}</span>
              <input
                required
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                className="w-24 rounded border border-slate-500 bg-slate-900 px-2 py-1 text-white"
                placeholder="Answer"
              />
              <button
                type="button"
                onClick={() => {
                  setCaptcha(createCaptcha());
                  setCaptchaInput("");
                }}
                className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-100"
              >
                Refresh
              </button>
            </div>
          </div>

          {error && <p data-anim-field className="rounded bg-rose-500/20 p-2 text-sm text-rose-300">{error}</p>}
          <button data-anim-field disabled={loading} className="w-full rounded-lg bg-indigo-500 px-4 py-2 font-semibold hover:bg-indigo-400 disabled:opacity-60">
            {loading ? (isRegister ? "Signing up..." : "Logging in...") : isRegister ? "Create Account" : "Login"}
          </button>
          <p ref={successRef} className="text-center text-xs text-emerald-300 opacity-0">Success</p>
        </form>
        <p data-anim-field className="mt-4 text-sm text-slate-300">
          {isRegister ? "Already have an account?" : "Need student account?"}{" "}
          <Link to={isRegister ? "/login" : "/register"} className="text-indigo-300 hover:text-indigo-200">
            {isRegister ? "Login" : "Register"}
          </Link>
        </p>
      </div>
    </main>
  );
}

function Dashboard({ token, user, setUser, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [attendance, setAttendance] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [note, setNote] = useState("");
  const pageRef = useRef(null);
  const contentRef = useRef(null);
  const infoRef = useRef(null);

  const [msgForm, setMsgForm] = useState({
    recipientRole: user.role === "super_admin" ? "branch_admin" : "super_admin",
    branch: "",
    recipientUserIds: [],
    selectAll: false,
    content: "",
  });
  const [paymentForm, setPaymentForm] = useState({ studentId: "", amount: "500", branchAdminId: "" });
  const [verifyForm, setVerifyForm] = useState({ razorpay_order_id: "", razorpay_payment_id: "", razorpay_signature: "" });
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "", branch: "" });
  const [studentForm, setStudentForm] = useState({ name: "", email: "", password: "", branch: user.branch || "" });

  useEffect(() => {
    if (!pageRef.current) return;
    animateEntry(pageRef.current, { duration: 760 });
    const detachButtons = attachButtonAnimations(pageRef.current);
    const detachFocus = attachFormFocusAnimations(pageRef.current);
    return () => {
      detachButtons();
      detachFocus();
    };
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      animateEntry(contentRef.current, { duration: 650 });
      animateStaggerIn(contentRef.current.querySelectorAll("[data-anim-card], [data-anim-list-item], [data-anim-form-field]"), {
        duration: 680,
      });
    }
  }, [activeTab, attendance.length, messages.length, payments.length, users.length, notifications.length]);

  useEffect(() => {
    if (info && infoRef.current) animateSuccess(infoRef.current);
  }, [info]);

  const api = async (path, options = {}) => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed.");
    return data;
  };

  const loadAll = async () => {
    try {
      setError("");
      const [attendanceData, profile, inboxData, notificationData] = await Promise.all([
        api("/attendance"),
        api("/auth/me"),
        api("/messages/inbox"),
        api("/notifications"),
      ]);
      setAttendance(attendanceData);
      setMessages(inboxData);
      setNotifications(notificationData);
      setUser(profile);
      localStorage.setItem("user", JSON.stringify(profile));
      if (profile.role !== "student") setUsers(await api("/users"));
      if (profile.role === "super_admin") setPayments(await api("/payments"));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    const socket = io(SOCKET_URL, { auth: { token } });
    socket.on("inbox:new", (incoming) => setMessages((prev) => [incoming, ...prev]));
    socket.on("notification:new", (incoming) => setNotifications((prev) => [incoming, ...prev]));
    return () => socket.disconnect();
  }, [token]);

  const unreadNotice = notifications.filter((n) => !n.readAt).length;
  const now = new Date();
  const expiryDate = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;
  const graceDate = user.graceEndsAt ? new Date(user.graceEndsAt) : null;
  const daysToExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / 86400000) : null;
  const graceDaysLeft = graceDate ? Math.ceil((graceDate.getTime() - now.getTime()) / 86400000) : null;

  const stats = useMemo(
    () => ({
      active: attendance.filter((a) => !a.checkOutAt).length,
      records: attendance.length,
      unread: messages.filter((m) => !m.readBy?.some((id) => String(id) === String(user.id))).length,
      students: users.filter((u) => u.role === "student").length,
    }),
    [attendance, messages, users, user.id]
  );

  const myActive = attendance.find((a) => a.student?._id === user.id && !a.checkOutAt);
  const checkIn = async () => {
    try {
      await api("/attendance/check-in", { method: "POST", body: JSON.stringify({ note }) });
      setInfo("Checked in.");
      setNote("");
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };
  const checkOut = async () => {
    try {
      if (!myActive) return;
      await api(`/attendance/check-out/${myActive._id}`, { method: "PATCH" });
      setInfo("Checked out.");
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };
  const markRead = async (id) => {
    try {
      const updated = await api(`/messages/${id}/read`, { method: "PATCH" });
      setMessages((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
    } catch (err) {
      setError(err.message);
    }
  };
  const markNoticeRead = async (id) => {
    try {
      const updated = await api(`/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => (n._id === updated._id ? updated : n)));
    } catch (err) {
      setError(err.message);
    }
  };

  const recipientOptions = useMemo(() => {
    if (user.role === "super_admin") {
      return users.filter((u) => u.role === "branch_admin" && (!msgForm.branch || u.branch === msgForm.branch));
    }
    if (user.role === "branch_admin" && msgForm.recipientRole === "student") {
      return users.filter((u) => u.role === "student" && u.branch === user.branch);
    }
    if (user.role === "branch_admin" && msgForm.recipientRole === "super_admin") {
      return users.filter((u) => u.role === "super_admin");
    }
    return [];
  }, [users, user.role, user.branch, msgForm.recipientRole, msgForm.branch]);

  const branchList = [...new Set(users.filter((u) => u.role === "branch_admin").map((u) => u.branch).filter(Boolean))];

  const sendMessage = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        recipientRole: user.role === "super_admin" ? "branch_admin" : msgForm.recipientRole,
        content: msgForm.content,
        selectAll: msgForm.selectAll,
        recipientUserIds: msgForm.selectAll ? [] : msgForm.recipientUserIds,
      };
      if (user.role === "super_admin" && msgForm.branch) payload.branch = msgForm.branch;
      const result = await api("/messages/send", { method: "POST", body: JSON.stringify(payload) });
      setInfo(`Sent ${result.count || 1} message(s).`);
      setMsgForm((p) => ({ ...p, content: "", recipientUserIds: [], selectAll: false }));
    } catch (err) {
      setError(err.message);
    }
  };

  const createOrder = async (e) => {
    e.preventDefault();
    try {
      const result = await api("/payments/order", { method: "POST", body: JSON.stringify(paymentForm) });
      setInfo(`Order created: ${result.orderId}`);
      setVerifyForm((p) => ({ ...p, razorpay_order_id: result.orderId }));
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };
  const verifyPayment = async (e) => {
    e.preventDefault();
    try {
      await api("/payments/verify", { method: "POST", body: JSON.stringify(verifyForm) });
      setInfo("Payment verified and subscription updated.");
      setVerifyForm({ razorpay_order_id: "", razorpay_payment_id: "", razorpay_signature: "" });
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const createBranchAdmin = async (e) => {
    e.preventDefault();
    try {
      await api("/users/branch-admin", { method: "POST", body: JSON.stringify(adminForm) });
      setAdminForm({ name: "", email: "", password: "", branch: "" });
      setInfo("Branch admin created.");
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const createStudent = async (e) => {
    e.preventDefault();
    try {
      const payload = user.role === "super_admin" ? studentForm : { ...studentForm, branch: user.branch };
      await api("/users/student", { method: "POST", body: JSON.stringify(payload) });
      setStudentForm({ name: "", email: "", password: "", branch: user.branch || "" });
      setInfo("Student created.");
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const navItems = [
    { id: "overview", label: "Overview" },
    { id: "attendance", label: "Attendance" },
    { id: "messages", label: "Messaging" },
    { id: "notifications", label: `Notifications (${unreadNotice})` },
  ];
  if (user.role === "super_admin") navItems.push({ id: "payments", label: "Payments" });
  if (user.role === "student") navItems.push({ id: "timing", label: "In/Out Timing" });
  if (user.role !== "student") navItems.push({ id: "manage", label: "Manage Users" });

  return (
    <main ref={pageRef} className="min-h-screen bg-gradient-to-b from-slate-100 to-indigo-100 text-slate-800">
      <header className="sticky top-0 z-10 border-b border-white/40 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">Library Dashboard</h1>
            <p className="text-sm text-slate-600">
              {roleLabel[user.role]} {user.branch ? `- ${user.branch}` : ""}
            </p>
            {user.role === "student" && (
              <>
                <p className={`text-xs mt-1 ${user.accessRestricted ? "text-rose-700" : "text-emerald-700"}`}>
                  Access: {user.accessRestricted ? "Restricted (payment required)" : "Active"} | Subscription until: {user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toDateString() : "Not set"}
                </p>
                {expiryDate && (
                  <p className="text-xs mt-1 text-indigo-700">
                    {daysToExpiry >= 0 ? `Countdown: ${daysToExpiry} day(s) left before expiry.` : `Expired. Grace period left: ${Math.max(graceDaysLeft || 0, 0)} day(s).`}
                  </p>
                )}
              </>
            )}
          </div>
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-white" onClick={onLogout}>
            Logout
          </button>
        </div>
        <nav className="mx-auto max-w-7xl px-4 pb-3 flex flex-wrap gap-2">
          {navItems.map((n) => (
            <button key={n.id} onClick={() => setActiveTab(n.id)} className={`rounded-full px-4 py-2 text-sm transition ${activeTab === n.id ? "bg-indigo-600 text-white" : "bg-white text-slate-700"}`}>
              {n.label}
            </button>
          ))}
        </nav>
      </header>

      <div ref={contentRef} className="mx-auto max-w-7xl p-4">
        {error && <p className="mb-4 rounded bg-rose-100 p-2 text-rose-700">{error}</p>}
        {info && (
          <p ref={infoRef} className="mb-4 rounded bg-emerald-100 p-2 text-emerald-700">
            {info}
          </p>
        )}

        {activeTab === "overview" && (
          <section className="grid gap-4 md:grid-cols-4">
            <FancyCard label="Active In Library" value={stats.active} />
            <FancyCard label="Attendance Records" value={stats.records} />
            <FancyCard label={user.role === "student" ? "My Role" : "Students"} value={user.role === "student" ? "Student" : stats.students} />
            <FancyCard label="Unread Messages" value={stats.unread} />
          </section>
        )}

        {activeTab === "timing" && user.role === "student" && (
          <Card title="In/Out Timing">
            <Input dataAnim label="Note (optional)" value={note} onChange={setNote} required={false} />
            <div className="mt-2 flex gap-2">
              <button disabled={Boolean(myActive) || user.accessRestricted} onClick={checkIn} className="rounded bg-emerald-600 px-4 py-2 text-white disabled:opacity-50">
                Check In
              </button>
              <button disabled={!myActive || user.accessRestricted} onClick={checkOut} className="rounded bg-amber-600 px-4 py-2 text-white disabled:opacity-50">
                Check Out
              </button>
            </div>
          </Card>
        )}

        {activeTab === "attendance" && (
          <Card title="Attendance History">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="px-2 py-2">Student</th>
                    <th className="px-2 py-2">Branch</th>
                    <th className="px-2 py-2">Check In</th>
                    <th className="px-2 py-2">Check Out</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((row) => (
                    <tr key={row._id} data-anim-list-item className="border-t border-slate-200">
                      <td className="px-2 py-2">{row.student?.name || "-"}</td>
                      <td className="px-2 py-2">{row.branch}</td>
                      <td className="px-2 py-2">{new Date(row.checkInAt).toLocaleString()}</td>
                      <td className="px-2 py-2">{row.checkOutAt ? new Date(row.checkOutAt).toLocaleString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === "messages" && (
          <section className="grid gap-4 lg:grid-cols-2">
            {(user.role === "super_admin" || user.role === "branch_admin") && (
              <Card title="Compose Message">
                <form onSubmit={sendMessage} className="space-y-2">
                  {user.role === "super_admin" && <Select label="Target Branch (optional)" value={msgForm.branch} onChange={(v) => setMsgForm((p) => ({ ...p, branch: v }))} options={branchList} />}
                  {user.role === "branch_admin" && <Select label="Recipient Role" value={msgForm.recipientRole} onChange={(v) => setMsgForm((p) => ({ ...p, recipientRole: v, recipientUserIds: [], selectAll: false }))} options={["super_admin", "student"]} />}
                  <label className="text-sm flex items-center gap-2">
                    <input type="checkbox" checked={msgForm.selectAll} onChange={(e) => setMsgForm((p) => ({ ...p, selectAll: e.target.checked, recipientUserIds: [] }))} />
                    Select All
                  </label>
                  {!msgForm.selectAll && (
                    <div className="max-h-40 overflow-auto rounded border border-slate-200 p-2 space-y-1">
                      {recipientOptions.map((r) => {
                        const id = r.id || r._id;
                        return (
                          <label key={id} data-anim-list-item className="flex gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={msgForm.recipientUserIds.includes(id)}
                              onChange={() =>
                                setMsgForm((p) => ({
                                  ...p,
                                  recipientUserIds: p.recipientUserIds.includes(id) ? p.recipientUserIds.filter((x) => x !== id) : [...p.recipientUserIds, id],
                                }))
                              }
                            />
                            {r.name} ({r.branch || "Global"})
                          </label>
                        );
                      })}
                    </div>
                  )}
                  <Input dataAnim label="Message" value={msgForm.content} onChange={(v) => setMsgForm((p) => ({ ...p, content: v }))} />
                  <button className="rounded bg-slate-900 px-4 py-2 text-white">Send</button>
                </form>
              </Card>
            )}
            <Card title="Inbox">
              <div className="space-y-2">
                {messages.map((m) => {
                  const read = m.readBy?.some((id) => String(id) === String(user.id));
                  const senderName = m.sender?.name || "System";
                  const senderBranch = m.sender?.branch || "No Branch";
                  return (
                    <div key={m._id} data-anim-list-item className="rounded border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">From: {user.role === "super_admin" ? `${senderName} (${senderBranch})` : senderName}</p>
                      <p className="font-medium">{m.content}</p>
                      {user.role === "student" && !read && (
                        <button onClick={() => markRead(m._id)} className="mt-1 rounded bg-indigo-600 px-2 py-1 text-xs text-white">
                          Mark as Read
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </section>
        )}

        {activeTab === "notifications" && (
          <Card title="Real-Time Notifications">
            <div className="space-y-2">
              {notifications.map((n) => (
                <div key={n._id} data-anim-list-item className={`rounded border p-3 ${n.readAt ? "border-slate-200" : "border-indigo-300 bg-indigo-50"}`}>
                  <p className="font-semibold">{n.title}</p>
                  <p className="text-sm">{n.body}</p>
                  {!n.readAt && (
                    <button onClick={() => markNoticeRead(n._id)} className="mt-1 rounded bg-slate-900 px-2 py-1 text-xs text-white">
                      Mark Read
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === "payments" && user.role === "super_admin" && (
          <section className="grid gap-4 lg:grid-cols-2">
            <Card title="Create Razorpay Order">
              <form onSubmit={createOrder} className="space-y-2">
                <Select
                  label="Student"
                  value={paymentForm.studentId}
                  onChange={(v) => setPaymentForm((p) => ({ ...p, studentId: v }))}
                  options={users
                    .filter((u) => u.role === "student")
                    .map((s) => ({ label: `${s.name} (${s.branch})`, value: s.id || s._id }))}
                />
                <Input dataAnim label="Amount (INR)" type="number" value={paymentForm.amount} onChange={(v) => setPaymentForm((p) => ({ ...p, amount: v }))} />
                <Select
                  label="Branch Admin QR Owner (optional)"
                  value={paymentForm.branchAdminId}
                  onChange={(v) => setPaymentForm((p) => ({ ...p, branchAdminId: v }))}
                  options={users
                    .filter((u) => u.role === "branch_admin")
                    .map((a) => ({ label: `${a.name} (${a.branch})`, value: a.id || a._id }))}
                />
                <button className="rounded bg-indigo-600 px-4 py-2 text-white">Create Order</button>
              </form>
            </Card>
            <Card title="Verify Payment (Manual/Test)">
              <form onSubmit={verifyPayment} className="space-y-2">
                <Input dataAnim label="Razorpay Order ID" value={verifyForm.razorpay_order_id} onChange={(v) => setVerifyForm((p) => ({ ...p, razorpay_order_id: v }))} />
                <Input dataAnim label="Razorpay Payment ID" value={verifyForm.razorpay_payment_id} onChange={(v) => setVerifyForm((p) => ({ ...p, razorpay_payment_id: v }))} />
                <Input dataAnim label="Razorpay Signature" value={verifyForm.razorpay_signature} onChange={(v) => setVerifyForm((p) => ({ ...p, razorpay_signature: v }))} />
                <button className="rounded bg-emerald-600 px-4 py-2 text-white">Verify & Activate</button>
              </form>
            </Card>
            <Card title="Payment Records">
              <div className="space-y-2 max-h-96 overflow-auto">
                {payments.map((p) => (
                  <div key={p._id} data-anim-list-item className="rounded border border-slate-200 p-2 text-sm">
                    <p>
                      <b>{p.student?.name}</b> - {p.branch}
                    </p>
                    <p>Status: {p.status} | Amount: INR {p.amount}</p>
                    <p>Order: {p.razorpayOrderId}</p>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        )}

        {activeTab === "manage" && user.role !== "student" && (
          <section className="grid gap-4 lg:grid-cols-2">
            {user.role === "super_admin" && (
              <Card title="Create Branch Admin">
                <form onSubmit={createBranchAdmin} className="space-y-2">
                  <Input dataAnim label="Name" value={adminForm.name} onChange={(v) => setAdminForm((p) => ({ ...p, name: v }))} />
                  <Input dataAnim label="Email" type="email" value={adminForm.email} onChange={(v) => setAdminForm((p) => ({ ...p, email: v }))} />
                  <PasswordInput label="Password" value={adminForm.password} onChange={(v) => setAdminForm((p) => ({ ...p, password: v }))} />
                  <Input dataAnim label="Branch" value={adminForm.branch} onChange={(v) => setAdminForm((p) => ({ ...p, branch: v }))} />
                  <button className="rounded bg-violet-600 px-4 py-2 text-white">Create Branch Admin</button>
                </form>
              </Card>
            )}
            <Card title="Create Student">
              <form onSubmit={createStudent} className="space-y-2">
                <Input dataAnim label="Name" value={studentForm.name} onChange={(v) => setStudentForm((p) => ({ ...p, name: v }))} />
                <Input dataAnim label="Email" type="email" value={studentForm.email} onChange={(v) => setStudentForm((p) => ({ ...p, email: v }))} />
                <PasswordInput label="Password" value={studentForm.password} onChange={(v) => setStudentForm((p) => ({ ...p, password: v }))} />
                {user.role === "super_admin" ? (
                  <Input dataAnim label="Branch" value={studentForm.branch} onChange={(v) => setStudentForm((p) => ({ ...p, branch: v }))} />
                ) : (
                  <Input dataAnim label="Branch" value={user.branch || ""} onChange={() => {}} disabled />
                )}
                <button className="rounded bg-indigo-600 px-4 py-2 text-white">Create Student</button>
              </form>
            </Card>
          </section>
        )}
      </div>
    </main>
  );
}

function FancyCard({ label, value }) {
  return (
    <div data-anim-card className="rounded-2xl bg-white/85 p-4 shadow-lg">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-extrabold text-indigo-700">{value}</p>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section data-anim-card className="rounded-2xl border border-indigo-100 bg-white/90 p-4 shadow-lg">
      <h2 className="mb-3 text-lg font-semibold text-slate-800">{title}</h2>
      {children}
    </section>
  );
}

function Input({ label, value, onChange, type = "text", required = true, dark = false, disabled, dataAnim = false }) {
  return (
    <label data-anim-field={dataAnim ? "true" : undefined} className="block">
      <span className={`mb-1 block text-sm ${dark ? "text-slate-200" : "text-slate-700"}`}>{label}</span>
      <input
        required={required}
        disabled={disabled}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border px-3 py-2 ${dark ? "border-slate-500 bg-slate-800/80 text-white" : "border-slate-300 bg-white"}`}
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  const normalized = options.map((o) => (typeof o === "string" ? { label: o, value: o } : o));
  return (
    <label data-anim-form-field className="block">
      <span className="mb-1 block text-sm text-slate-700">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
        <option value="">Select</option>
        {normalized.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function PasswordInput({ label, value, onChange, required = true }) {
  const [show, setShow] = useState(false);
  return (
    <label data-anim-form-field className="block">
      <span className="mb-1 block text-sm text-slate-700">{label}</span>
      <div className="relative">
        <input
          required={required}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-11"
        />
        <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">
          {show ? "🙈" : "👁️"}
        </button>
      </div>
    </label>
  );
}

export default App;
