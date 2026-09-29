const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const auth = require("../middleware/auth");
const User = require("../models/User");
const Attempt = require("../models/Attempt");
const Roadmap = require("../models/Roadmap");
const Lesson = require("../models/Lesson");
const PromptLog = require("../models/PromptLog");
const { callAI } = require("../utils/aiClient");
const {
  roadmapPromptV1, roadmapPromptV2, roadmapPromptV3,
  lessonPromptV1, lessonPromptV2, lessonPromptV3,
  quizPromptV1, quizPromptV2, quizPromptV3,
  mockTestPrompt, interviewPrompt, feedbackPrompt, coachChatPrompt
} = require("../prompts/prompts");

/* ==================== 0. AUTHENTICATION ==================== */
router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ msg: "Please fill in all fields" });
    }
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists with this email" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await User.create({ name, email, password: hashedPassword });
    const token = user.generateToken();
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) {
    console.error("Register error:", e.message);
    res.status(500).json({ msg: "Registration failed" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: "Please enter email and password" });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = user.generateToken();
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) {
    console.error("Login error:", e.message);
    res.status(500).json({ msg: "Login failed" });
  }
});

/* ==================== 1. PROFILE & ROADMAP ==================== */
router.put("/profile", auth, async (req, res) => {
  try {
    const profile = req.body;
    const version = req.body.promptVersion || "V3";
    await User.findByIdAndUpdate(req.user.id, { profile });

    let prompt;
    if (version === "V1") prompt = roadmapPromptV1(profile);
    else if (version === "V2") prompt = roadmapPromptV2(profile);
    else prompt = roadmapPromptV3(profile);

    const roadmapData = await callAI(prompt);
    await Roadmap.findOneAndDelete({ user: req.user.id });
    const rm = await Roadmap.create({ user: req.user.id, data: roadmapData });

    res.json(rm.data);
  } catch (e) {
    console.error("Profile/Roadmap error:", e.message);
    res.status(500).json({ msg: "Failed to generate roadmap" });
  }
});

router.get("/roadmap", auth, async (req, res) => {
  try {
    let rm = await Roadmap.findOne({ user: req.user.id });
    if (!rm || !rm.data || !rm.data.weeks) {
      const user = await User.findById(req.user.id);
      const profile = user ? (user.profile || {}) : {};
      const defaultProfile = {
        education: profile.education || "Undergraduate",
        target: profile.target || "Placements",
        skillLevel: profile.skillLevel || "intermediate",
        dailyHours: profile.dailyHours || 2,
        weeks: profile.weeks || 8,
        goals: profile.goals || "Master Quant & Logical Reasoning",
        topics: profile.topics || ["Percentage", "Time and Work", "Logical Reasoning", "Data Interpretation"]
      };
      const roadmapData = await callAI(roadmapPromptV3(defaultProfile));
      if (rm) await Roadmap.findOneAndDelete({ user: req.user.id });
      rm = await Roadmap.create({ user: req.user.id, data: roadmapData });
    }
    res.json(rm.data);
  } catch (e) {
    console.error("Roadmap get error:", e.message);
    res.status(500).json({ msg: "Failed to load roadmap" });
  }
});

/* ==================== 2. LESSON / CONCEPT LEARNING ==================== */
router.post("/lesson", auth, async (req, res) => {
  try {
    const topic = (req.body.topic || "").trim();
    const level = req.body.skillLevel || "intermediate";
    const version = req.body.promptVersion || "V3";

    if (!topic) return res.status(400).json({ msg: "Topic required" });

    // Keyed by user AND topic AND version
    let lesson = await Lesson.findOne({ user: req.user.id, topic, "content.version": version });

    if (!lesson) {
      let prompt;
      if (version === "V1") prompt = lessonPromptV1(topic, level);
      else if (version === "V2") prompt = lessonPromptV2(topic, level);
      else prompt = lessonPromptV3(topic, level);

      const content = await callAI(prompt);
      if (content && typeof content === "object") content.version = version;
      lesson = await Lesson.create({ user: req.user.id, topic, content });
    }

    res.json(lesson.content);
  } catch (e) {
    console.error("Lesson error:", e.message);
    res.status(500).json({ msg: "Lesson generation failed" });
  }
});

/* ==================== 3. ADAPTIVE QUIZ ==================== */
router.post("/quiz", auth, async (req, res) => {
  try {
    const { topic, difficulty = "medium", count = 5, promptVersion = "V3" } = req.body;
    if (!topic) return res.status(400).json({ msg: "Topic required" });

    let prompt;
    if (promptVersion === "V1") prompt = quizPromptV1(topic, difficulty, count);
    else if (promptVersion === "V2") prompt = quizPromptV2(topic, difficulty, count);
    else prompt = quizPromptV3(topic, difficulty, count);

    const data = await callAI(prompt);
    res.json(data);
  } catch (e) {
    console.error("Quiz error:", e.message);
    res.status(500).json({ msg: "Quiz generation failed" });
  }
});

/* ==================== 4. MOCK TEST ==================== */
router.post("/mocktest", auth, async (req, res) => {
  try {
    const prompt = mockTestPrompt(15);
    const data = await callAI(prompt);
    res.json(data);
  } catch (e) {
    console.error("Mocktest error:", e.message);
    res.status(500).json({ msg: "Mock test generation failed" });
  }
});

/* ==================== 5. COMPANY INTERVIEW PREP ==================== */
router.post("/interview", auth, async (req, res) => {
  try {
    const { company = "TCS", topic = "General Aptitude" } = req.body;
    const prompt = interviewPrompt(company, topic);
    const data = await callAI(prompt);
    res.json(data);
  } catch (e) {
    console.error("Interview prep error:", e.message);
    res.status(500).json({ msg: "Interview questions generation failed" });
  }
});

/* ==================== 6. ATTEMPT SUBMISSION & EVALUATION ==================== */
router.post("/attempt", auth, async (req, res) => {
  try {
    const { topic, difficulty = "medium", questions = [], answers = [] } = req.body;

    let score = 0;
    const details = questions.map((q, i) => {
      const selectedIndex = answers[i]?.selected;
      const isCorrect = selectedIndex === q.answer;
      if (isCorrect) score++;

      return {
        q: q.q,
        selected: selectedIndex,
        correctAnswer: q.answer,
        correct: isCorrect,
        conceptTag: q.conceptTag || q.section || topic,
        timeTaken: answers[i]?.timeTaken || 0
      };
    });

    const total = questions.length || 1;
    const accuracy = Math.round((score / total) * 100);
    const totalTime = details.reduce((s, d) => s + d.timeTaken, 0);
    const avgTime = Math.round(totalTime / total);

    // Call AI Feedback Prompt (Prompt Chaining)
    const prompt = feedbackPrompt({ topic, difficulty, score, total, accuracy, avgTime, details });
    const feedback = await callAI(prompt);

    const attempt = await Attempt.create({
      userId: req.user.id,
      topic,
      difficulty,
      questions,
      answers: details,
      score,
      accuracy,
      avgTime,
      weakTopics: feedback.weakTopics || [],
    });

    res.json({
      score,
      total,
      accuracy,
      avgTime,
      feedback,
      attemptId: attempt._id
    });
  } catch (e) {
    console.error("Attempt error:", e.message);
    res.status(500).json({ msg: "Failed to submit attempt" });
  }
});

/* ==================== 7. AI CONVERSATIONAL COACH ==================== */
router.post("/coach", auth, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    const user = await User.findById(req.user.id);
    const profile = user ? user.profile || {} : {};

    const prompt = coachChatPrompt(message, history, profile);
    const response = await callAI(prompt);

    res.json(response);
  } catch (e) {
    console.error("Coach error:", e.message);
    res.status(500).json({ msg: "AI Coach response failed" });
  }
});

/* ==================== 8. PROMPT ENGINEERING WORKBENCH ==================== */
router.post("/prompts/compare", auth, async (req, res) => {
  try {
    const { type = "lesson", topic = "Percentage", difficulty = "medium" } = req.body;

    let p1, p2, p3;
    if (type === "lesson") {
      p1 = lessonPromptV1(topic, difficulty);
      p2 = lessonPromptV2(topic, difficulty);
      p3 = lessonPromptV3(topic, difficulty);
    } else if (type === "quiz") {
      p1 = quizPromptV1(topic, difficulty, 3);
      p2 = quizPromptV2(topic, difficulty, 3);
      p3 = quizPromptV3(topic, difficulty, 3);
    } else {
      const dummyProfile = { target: "TCS", weeks: 4, skillLevel: difficulty };
      p1 = roadmapPromptV1(dummyProfile);
      p2 = roadmapPromptV2(dummyProfile);
      p3 = roadmapPromptV3(dummyProfile);
    }

    const t1Start = Date.now();
    const res1 = await callAI(p1);
    const t1Time = Date.now() - t1Start;

    const t2Start = Date.now();
    const res2 = await callAI(p2);
    const t2Time = Date.now() - t2Start;

    const t3Start = Date.now();
    const res3 = await callAI(p3);
    const t3Time = Date.now() - t3Start;

    res.json({
      v1: { prompt: p1, result: res1, timeMs: t1Time, strategy: "V1: Standard Direct Prompting" },
      v2: { prompt: p2, result: res2, timeMs: t2Time, strategy: "V2: Role & Structured Prompting" },
      v3: { prompt: p3, result: res3, timeMs: t3Time, strategy: "V3: Context-Aware Few-Shot & Chained Prompting" }
    });
  } catch (e) {
    console.error("Prompt workbench error:", e.message);
    res.status(500).json({ msg: "Prompt comparison failed" });
  }
});

router.post("/prompts/run", auth, async (req, res) => {
  try {
    const { systemPrompt, userPrompt } = req.body;
    const start = Date.now();
    const result = await callAI(userPrompt, systemPrompt);
    const timeMs = Date.now() - start;

    await PromptLog.create({
      user: req.user.id,
      promptType: "custom",
      version: "Custom",
      systemPrompt,
      userPrompt,
      resultOutput: result,
      executionTimeMs: timeMs
    });

    res.json({ result, timeMs });
  } catch (e) {
    console.error("Custom prompt error:", e.message);
    res.status(500).json({ msg: "Custom prompt execution failed" });
  }
});

/* ==================== 9. PERFORMANCE STATS & DASHBOARD ==================== */
router.get("/stats", auth, async (req, res) => {
  try {
    const attempts = await Attempt.find({ userId: req.user.id }).sort({ createdAt: -1 });
    const testsTaken = attempts.length;

    const totalScore = attempts.reduce((s, a) => s + (a.score || 0), 0);
    const totalQuestions = attempts.reduce((s, a) => s + (a.questions?.length || a.answers?.length || 0), 0);
    const overallAccuracy = totalQuestions
      ? Math.round((totalScore / totalQuestions) * 100)
      : 0;

    const avgSpeed = testsTaken
      ? Math.round(attempts.reduce((s, a) => s + (a.avgTime || 0), 0) / testsTaken)
      : 0;

    // Topic breakdown
    const byTopic = {};
    attempts.forEach(a => {
      const t = a.topic || "General Aptitude";
      if (!byTopic[t]) byTopic[t] = { attempted: 0, correct: 0, totalTime: 0, attemptsCount: 0 };
      const qs = a.questions?.length || a.answers?.length || 0;
      byTopic[t].attempted += qs;
      byTopic[t].correct += a.score || 0;
      byTopic[t].totalTime += (a.avgTime || 0) * qs;
      byTopic[t].attemptsCount += 1;
    });

    // Compute percentile estimation based on accuracy & speed
    let estimatedPercentile = 50;
    if (testsTaken > 0) {
      const accuracyWeight = overallAccuracy * 0.7;
      const speedBonus = avgSpeed > 0 && avgSpeed < 60 ? (60 - avgSpeed) * 0.5 : 0;
      estimatedPercentile = Math.min(99, Math.max(10, Math.round(accuracyWeight + speedBonus)));
    }

    // Award achievement badges
    const badges = [];
    if (testsTaken >= 1) badges.push({ icon: "[Badge]", name: "First Step", desc: "Completed your first aptitude test" });
    if (testsTaken >= 5) badges.push({ icon: "[Badge]", name: "Consistency Champion", desc: "Completed 5 practice tests" });
    if (overallAccuracy >= 80 && testsTaken >= 2) badges.push({ icon: "[Badge]", name: "Precision Master", desc: "Maintained 80%+ accuracy" });
    if (avgSpeed > 0 && avgSpeed < 45 && testsTaken >= 2) badges.push({ icon: "[Badge]", name: "Speed Demon", desc: "Average under 45s per question" });
    if (Object.keys(byTopic).length >= 5) badges.push({ icon: "[Badge]", name: "Versatile Learner", desc: "Practiced in 5+ domains" });

    // Competency breakdown
    const competencyReport = Object.entries(byTopic).map(([topic, stats]) => {
      const acc = stats.attempted ? Math.round((stats.correct / stats.attempted) * 100) : 0;
      let level = "Needs Practice";
      if (acc >= 85) level = "Mastery";
      else if (acc >= 70) level = "Proficient";
      else if (acc >= 50) level = "Developing";

      return {
        topic,
        attempted: stats.attempted,
        correct: stats.correct,
        accuracy: acc,
        avgSpeedSec: stats.attempted ? Math.round(stats.totalTime / stats.attempted) : 0,
        competencyLevel: level
      };
    });

    res.json({
      testsTaken,
      overallAccuracy,
      avgSpeedSec: avgSpeed,
      estimatedPercentile,
      byTopic,
      competencyReport,
      badges,
      recent: attempts.slice(0, 10)
    });
  } catch (e) {
    console.error("Stats error:", e.message);
    res.status(500).json({ msg: "Failed to load stats" });
  }
});

module.exports = router;
