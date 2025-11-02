const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// EJS + Middleware setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection (Cloud)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Schema
const healthSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  water: Number,
  sleep: Number,
  meals: Number,
  mood: String,
});

const Health = mongoose.model("Health", healthSchema);

// Routes
app.get("/", (req, res) => {
  res.render("index", { title: "HealthMate - Your Health Assistant" });
});


app.post("/add", async (req, res) => {
  const { water, sleep, meals, mood } = req.body;
  await Health.create({ water, sleep, meals, mood });
  res.redirect("/");
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
