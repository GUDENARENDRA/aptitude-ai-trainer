const mongoose = require("mongoose");

const LessonSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  topic: { type: String, required: true },
  content: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Lesson", LessonSchema);
