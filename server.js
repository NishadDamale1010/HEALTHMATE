// server.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Set EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Schema
const healthSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  date: { type: Date, default: Date.now },
  water: Number,
  sleep: Number,
  meals: Number,
  mood: String,
});

const Health = mongoose.model("Health", healthSchema);

// Routes
app.get("/", async (req, res) => {
  try {
    const records = await Health.find().sort({ date: -1 });
    res.render("index", {
      title: "HealthMate - Your Health Assistant",
      records,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading dashboard");
  }
});

// Registration page
app.get("/register", (req, res) => {
  res.render("register", { title: "Register - HealthMate" });
});

// Handle registration form
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const newUser = new Health({ name, email, password });
    await newUser.save();
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error registering user");
  }
});

// Add health data
app.post("/add", async (req, res) => {
  try {
    const { water, sleep, meals, mood } = req.body;
    await Health.create({ water, sleep, meals, mood });
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving health data");
  }
});

// Start server
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
