// server.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const bcrypt = require("bcryptjs");

const session = require("express-session");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware + EJS setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Session
app.use(
  session({
    secret: "healthmate_secret",
    resave: false,
    saveUninitialized: false,
  })
);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Schemas
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});

const healthSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  date: { type: Date, default: Date.now },
  water: Number,
  sleep: Number,
  meals: Number,
  mood: String,
});

const User = mongoose.model("User", userSchema);
const Health = mongoose.model("Health", healthSchema);

////////////////////////////////////////////////////////
// ROUTES
////////////////////////////////////////////////////////

// Home Page
app.get("/", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  const healthLogs = await Health.find({ userId: req.session.userId }).sort({ date: -1 });
  res.render("index", { title: "HealthMate - Dashboard", healthLogs });
});

// Register Page
app.get("/register", (req, res) => {
  res.render("register", { title: "Register - HealthMate", error: null });
});

// Register Logic
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.render("register", { title: "Register", error: "Email already exists!" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashed });
    await user.save();
    res.redirect("/login");
  } catch (err) {
    console.error("Registration Error:", err);
    res.render("register", { title: "Register", error: "Error during registration!" });
  }
});

// Login Page
app.get("/login", (req, res) => {
  res.render("login", { title: "Login - HealthMate", error: null });
});

// Login Logic
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.render("login", { title: "Login", error: "User not found!" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.render("login", { title: "Login", error: "Invalid password!" });

    req.session.userId = user._id;
    res.redirect("/");
  } catch (err) {
    console.error("Login Error:", err);
    res.render("login", { title: "Login", error: "Error during login!" });
  }
});

// Add Health Data
app.post("/add", async (req, res) => {
  const { water, sleep, meals, mood } = req.body;
  try {
    await Health.create({ userId: req.session.userId, water, sleep, meals, mood });
    res.redirect("/");
  } catch (err) {
    console.error("Add Data Error:", err);
    res.send("Error saving health data");
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

////////////////////////////////////////////////////////
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
