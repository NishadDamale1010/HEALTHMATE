const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  date: { type: Date, default: Date.now },
});

const healthSchema = new mongoose.Schema({
  userEmail: String,
  date: { type: Date, default: Date.now },
  water: Number,
  sleep: Number,
  meals: Number,
  mood: String,
});

const User = mongoose.model("User", userSchema);
const Health = mongoose.model("Health", healthSchema);

// ---------------- ROUTES ----------------

// Redirect root → login
app.get("/", (req, res) => res.redirect("/login"));

// Register page
app.get("/register", (req, res) => {
  res.render("register", { title: "Register - HealthMate" });
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.send("<h3>Email already registered. <a href='/login'>Login</a></h3>");
    }
    await User.create({ name, email, password });
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error during registration");
  }
});

// Login page
app.get("/login", (req, res) => {
  res.render("login", { title: "Login - HealthMate" });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, password });
    if (!user) return res.send("<h3>Invalid credentials. <a href='/login'>Try again</a></h3>");
    const logs = await Health.find({ userEmail: email }).sort({ date: -1 });
    res.render("dashboard", { title: "Dashboard - HealthMate", user, logs });
  } catch (err) {
    console.error(err);
    res.status(500).send("Login failed");
  }
});

// Add health data
app.post("/add", async (req, res) => {
  const { email, water, sleep, meals, mood } = req.body;
  try {
    await Health.create({ userEmail: email, water, sleep, meals, mood });
    const user = await User.findOne({ email });
    const logs = await Health.find({ userEmail: email }).sort({ date: -1 });
    res.render("dashboard", { title: "Dashboard - HealthMate", user, logs });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving health data");
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
