const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");
const MongoStore = require("connect-mongo");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// EJS + Middleware setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Session Setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  })
);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

const healthSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  date: { type: Date, default: Date.now },
  water: Number,
  sleep: Number,
  meals: Number,
  mood: String,
});

const User = mongoose.model("User", userSchema);
const Health = mongoose.model("Health", healthSchema);

// Middleware to protect routes
function isAuthenticated(req, res, next) {
  if (req.session.userId) return next();
  res.redirect("/login");
}

// Routes
app.get("/", (req, res) => {
  res.render("index", { title: "HealthMate - Your Health Assistant" });
});

app.get("/register", (req, res) => {
  res.render("register", { title: "Register" });
});

app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.send("⚠️ Username and password are required.");

    const existing = await User.findOne({ username });
    if (existing) return res.send("⚠️ Username already exists.");

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashed });
    res.redirect("/login");
  } catch (err) {
    console.error("Registration Error:", err);
    res.send("⚠️ Registration failed.");
  }
});

app.get("/login", (req, res) => {
  res.render("login", { title: "Login" });
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.send("❌ Invalid username or password.");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send("❌ Invalid username or password.");

    req.session.userId = user._id;
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Login Error:", err);
    res.send("⚠️ Login failed.");
  }
});

app.get("/dashboard", isAuthenticated, async (req, res) => {
  const logs = await Health.find({ userId: req.session.userId }).sort({ date: -1 });
  res.render("dashboard", { title: "Dashboard", logs });
});

app.post("/add", isAuthenticated, async (req, res) => {
  const { water, sleep, meals, mood } = req.body;
  await Health.create({ userId: req.session.userId, water, sleep, meals, mood });
  res.redirect("/dashboard");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
