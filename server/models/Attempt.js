const mongoose = require("mongoose");

const attemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  topic: String,
  difficulty: String,
  questions: Array,
  answers: Array,          // [{questionIndex, selected, correct, timeTaken}]
  score: Number,
  accuracy: Number,
  avgTime: Number,
  weakTopics: [String],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Attempt", attemptSchema);
