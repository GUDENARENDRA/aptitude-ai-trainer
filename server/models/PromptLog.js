const mongoose = require("mongoose");

const promptLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  promptType: { type: String, required: true }, // e.g. "lesson", "quiz", "roadmap", "interview"
  version: { type: String, required: true },    // e.g. "V1", "V2", "V3", "Custom"
  systemPrompt: String,
  userPrompt: String,
  resultOutput: Object,
  executionTimeMs: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("PromptLog", promptLogSchema);
