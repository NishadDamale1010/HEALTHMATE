const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();
const app = express();

// EJS + Static
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB
mongoose.connect('mongodb://localhost:27017/Healthmate', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("MongoDB connected successfully"))
    .catch(err => console.log("MongoDB connection error:", err));

// Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const logSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  date: { type: Date, default: Date.now },
  waterIntake: Number,
  sleepHours: Number,
  meals: String,
  mood: String,
});

const User = mongoose.model("User", userSchema);
const HealthLog = mongoose.model("HealthLog", logSchema);

// Routes
app.get("/", (req, res) => res.render("index", { title: "HealthMate 🩺" }));

app.get("/register", (req, res) => res.render("register"));
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  await User.create({ name, email, password });
  res.redirect("/login");
});

app.get("/login", (req, res) => res.render("login"));
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (user) res.redirect("/dashboard");
  else res.send("<h2>Invalid credentials. <a href='/login'>Try again</a></h2>");
});

app.get("/dashboard", async (req, res) => {
  const logs = await HealthLog.find().sort({ date: -1 });
  res.render("dashboard", { logs });
});

app.post("/add-log", async (req, res) => {
  const { waterIntake, sleepHours, meals, mood } = req.body;
  await HealthLog.create({ waterIntake, sleepHours, meals, mood });
  res.redirect("/dashboard");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
