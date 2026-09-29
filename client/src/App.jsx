import React, { useState, useEffect, useRef } from "react";
import api from "./services/api";
import "./App.css";

/* ==================== ROOT APP ==================== */
export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [view, setView] = useState("profile");
  const [selectedTopic, setSelectedTopic] = useState("Percentage");

  const logout = () => {
    localStorage.clear();
    setToken(null);
  };

  if (!token) {
    return <Auth onSuccess={(t) => { localStorage.setItem("token", t); setToken(t); }} />;
  }

  return (
    <div className="app">
      <nav>
        <h2>Aptitude Trainer</h2>
        <div className="navbtns">
          <button className={view === "profile" ? "active" : ""} onClick={() => setView("profile")}>Profile</button>
          <button className={view === "roadmap" ? "active" : ""} onClick={() => setView("roadmap")}>Roadmap</button>
          <button className={view === "lesson" ? "active" : ""} onClick={() => setView("lesson")}>Learn</button>
          <button className={view === "quiz" ? "active" : ""} onClick={() => setView("quiz")}>Practice</button>
          <button className={view === "mock" ? "active" : ""} onClick={() => setView("mock")}>Mock Test</button>
          <button className={view === "interview" ? "active" : ""} onClick={() => setView("interview")}>Interview</button>
          <button className={view === "coach" ? "active" : ""} onClick={() => setView("coach")}>Instructor</button>
          <button className={view === "workbench" ? "active" : ""} onClick={() => setView("workbench")}>Prompt Lab</button>
          <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}>Dashboard</button>
          <button className="danger" onClick={logout}>Logout</button>
        </div>
      </nav>

      <main>
        {view === "profile" && <Profile onNext={() => setView("roadmap")} />}
        {view === "roadmap" && <Roadmap onPick={(t) => { setSelectedTopic(t); setView("lesson"); }} />}
        {view === "lesson" && <Lesson topic={selectedTopic} setTopic={setSelectedTopic} onPractice={() => setView("quiz")} />}
        {view === "quiz" && <Quiz initialTopic={selectedTopic} />}
        {view === "mock" && <MockTest />}
        {view === "interview" && <InterviewPrep />}
        {view === "coach" && <AICoach />}
        {view === "workbench" && <PromptWorkbench />}
        {view === "dashboard" && <Dashboard />}
      </main>
    </div>
  );
}

/* ==================== AUTH COMPONENT ==================== */
function Auth({ onSuccess }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = mode === "register" ? "/auth/register" : "/auth/login";
      const body = mode === "register" ? form : { email: form.email, password: form.password };
      const { data } = await api.post(url, body);
      onSuccess(data.token);
    } catch (err) {
      setError(err.response?.data?.msg || "Authentication failed. Check details.");
    }
    setLoading(false);
  };

  return (
    <div className="center">
      <form className="card" style={{ maxWidth: 420, width: "100%" }} onSubmit={submit}>
        <h2>{mode === "register" ? "Create Account" : "Learner Login"}</h2>
        <p className="subtitle">Personalized Aptitude & Placement Interview Prep Platform</p>
        
        {mode === "register" && (
          <input
            placeholder="Full Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        )}
        <input
          type="email"
          placeholder="Email Address"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        
        {error && <p className="error" style={{ color: "#f87171", marginBottom: "1rem" }}>{error}</p>}
        
        <button type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Processing..." : mode === "register" ? "Register & Start" : "Login"}
        </button>
        
        <p style={{ marginTop: "1rem", textAlign: "center", cursor: "pointer" }} onClick={() => setMode(mode === "register" ? "login" : "register")}>
          {mode === "register" ? "Already registered? Login here" : "New student? Create an account"}
        </p>
      </form>
    </div>
  );
}

/* ==================== PROFILE & GOAL SETUP ==================== */
function Profile({ onNext }) {
  const ALL_TOPICS = [
    "Number System", "Percentage", "Profit and Loss", "Ratio and Proportion",
    "Time and Work", "Time, Speed and Distance", "Simple and Compound Interest",
    "Permutation and Combination", "Probability", "Data Interpretation",
    "Logical Reasoning", "Analytical Reasoning", "Verbal Ability",
    "Coding-Decoding", "Blood Relations", "Seating Arrangement", "Puzzles"
  ];

  const [p, setP] = useState({
    education: "B.Tech CSE",
    target: "TCS NQT / Placements",
    skillLevel: "intermediate",
    dailyHours: 2,
    weeks: 8,
    goals: "Master Quantitative Aptitude & Crack Technical Round",
    topics: ["Percentage", "Time and Work", "Logical Reasoning", "Data Interpretation"],
    promptVersion: "V3"
  });
  const [loading, setLoading] = useState(false);

  const toggleTopic = (t) => {
    setP((prev) => ({
      ...prev,
      topics: prev.topics.includes(t) ? prev.topics.filter((x) => x !== t) : [...prev.topics, t],
    }));
  };

  const save = async () => {
    setLoading(true);
    try {
      await api.put("/profile", p);
      onNext();
    } catch (e) {
      alert(e.response?.data?.msg || "Failed to generate roadmap");
    }
    setLoading(false);
  };

  return (
    <div className="card">
      <h2>Create Your Aptitude Profile</h2>
      <p>Provide your preparation details so your instructor can design your tailored learning roadmap.</p>
      
      <div className="row">
        <div style={{ flex: 1 }}>
          <label>Educational Background</label>
          <input
            placeholder="e.g., B.Tech CSE / B.Com / MCA"
            value={p.education}
            onChange={(e) => setP({ ...p, education: e.target.value })}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Target Exam or Company</label>
          <input
            placeholder="e.g., TCS NQT / Infosys / GATE / CAT"
            value={p.target}
            onChange={(e) => setP({ ...p, target: e.target.value })}
          />
        </div>
      </div>

      <div className="row">
        <div style={{ flex: 1 }}>
          <label>Current Skill Level</label>
          <select value={p.skillLevel} onChange={(e) => setP({ ...p, skillLevel: e.target.value })}>
            <option value="beginner">Beginner (Building Foundations)</option>
            <option value="intermediate">Intermediate (Improving Speed & Formulae)</option>
            <option value="advanced">Advanced (High-Difficulty & Speed Drills)</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label>Daily Study Time (Hours)</label>
          <input
            type="number"
            min="1"
            max="12"
            value={p.dailyHours}
            onChange={(e) => setP({ ...p, dailyHours: +e.target.value || 1 })}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Preparation Period (Weeks)</label>
          <input
            type="number"
            min="1"
            max="24"
            value={p.weeks}
            onChange={(e) => setP({ ...p, weeks: +e.target.value || 1 })}
          />
        </div>
      </div>

      <label>Content Template Strategy</label>
      <select value={p.promptVersion} onChange={(e) => setP({ ...p, promptVersion: e.target.value })}>
        <option value="V3">Structured Step-by-Step Template (Recommended)</option>
        <option value="V2">Standard Detailed Template</option>
        <option value="V1">Concise Direct Template</option>
      </select>

      <label>Specific Learning Goals</label>
      <textarea
        placeholder="e.g., Achieve 90+ percentile in TCS quantitative round in 60 days"
        value={p.goals}
        onChange={(e) => setP({ ...p, goals: e.target.value })}
      />

      <h4>Select Preferred Aptitude Topics:</h4>
      <div className="chips">
        {ALL_TOPICS.map((t) => (
          <span
            key={t}
            className={`chip ${p.topics.includes(t) ? "active" : ""}`}
            onClick={() => toggleTopic(t)}
          >
            {t}
          </span>
        ))}
      </div>

      <button disabled={loading} onClick={save} style={{ marginTop: "1rem" }}>
        {loading ? "Building Roadmap..." : "Save Profile & Generate Roadmap"}
      </button>
    </div>
  );
}

/* ==================== ROADMAP VIEW ==================== */
function Roadmap({ onPick }) {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/roadmap")
      .then((r) => { setRoadmap(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ textAlign: "center", padding: "2rem" }}>Loading your personalized learning roadmap...</p>;
  if (!roadmap || !roadmap.weeks || !Array.isArray(roadmap.weeks) || roadmap.weeks.length === 0) {
    return (
      <div className="card">
        <h2>Your Aptitude Preparation Roadmap</h2>
        <p>No active roadmap found. Save your details under the Profile tab or click below to generate your default roadmap.</p>
        <button onClick={() => {
          setLoading(true);
          api.get("/roadmap")
            .then((r) => { setRoadmap(r.data); setLoading(false); })
            .catch(() => setLoading(false));
        }}>
          Generate Default Roadmap
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2>Your Aptitude Preparation Roadmap</h2>
      <p>Follow your week-by-week structured study plan.</p>

      {roadmap.weeks?.map((w) => (
        <div key={w.week} className="card">
          <h3>Week {w.week} — {w.milestone}</h3>
          
          <div style={{ margin: "1rem 0" }}>
            {w.topics?.map((t, i) => (
              <div key={i} className="row" style={{ justifyContent: "space-between", background: "#0f172a", padding: "0.8rem 1rem", borderRadius: 8, marginBottom: "0.5rem" }}>
                <div>
                  <b style={{ color: "#f1f5f9" }}>{t.name}</b>
                  <div style={{ gap: "0.5rem", display: "flex", marginTop: "0.3rem" }}>
                    <span className="badge">{t.domain}</span>
                    <span className="badge" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399", borderColor: "rgba(16, 185, 129, 0.3)" }}>{t.difficulty}</span>
                    <span className="badge" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", borderColor: "rgba(59, 130, 246, 0.3)" }}>{t.hours} hrs</span>
                  </div>
                </div>
                <button className="btn-secondary" onClick={() => onPick(t.name)}>Study Concept →</button>
              </div>
            ))}
          </div>

          <p style={{ fontSize: "0.9rem", color: "#a5b4fc" }}><b>Assessment:</b> {w.assessment}</p>
        </div>
      ))}
    </div>
  );
}

/* ==================== CONCEPT LESSON VIEW ==================== */
function Lesson({ topic, setTopic, onPractice }) {
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [promptVersion, setPromptVersion] = useState("V3");

  const loadLesson = async () => {
    if (!topic) return;
    setLoading(true);
    setLesson(null);
    try {
      const { data } = await api.post("/lesson", { topic, promptVersion });
      setLesson(data);
    } catch (e) {
      alert("Failed to load lesson content");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (topic) loadLesson();
  }, [topic, promptVersion]);

  return (
    <div>
      <div className="card">
        <h2>Concept Learning & Visualization</h2>
        <div className="row">
          <div style={{ flex: 2 }}>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter Aptitude Topic (e.g., Percentage, Time and Work)"
            />
          </div>
          <div style={{ flex: 1 }}>
            <select value={promptVersion} onChange={(e) => setPromptVersion(e.target.value)}>
              <option value="V3">Structured Step-by-Step Template</option>
              <option value="V2">Standard Detailed Template</option>
              <option value="V1">Concise Direct Template</option>
            </select>
          </div>
          <button onClick={loadLesson}>{loading ? "Loading..." : "Load Lesson"}</button>
        </div>
      </div>

      {loading && <p>Preparing comprehensive lesson...</p>}

      {lesson && (
        <div className="card">
          <h2>Topic: {topic}</h2>
          
          <h3>Fundamental Concept</h3>
          <p>{lesson.concept}</p>

          {lesson.visualization && (
            <div>
              <h3>Visual Diagram & Structure</h3>
              <pre>{lesson.visualization}</pre>
            </div>
          )}

          <h3>Formulas & Key Equalities</h3>
          <ul>
            {lesson.formulas?.map((f, i) => <li key={i} style={{ marginBottom: "0.4rem" }}>{f}</li>)}
          </ul>

          <h3>Solved Exemplars with Step-by-Step Breakdown</h3>
          {lesson.examples?.map((ex, i) => (
            <div key={i} style={{ background: "#0f172a", padding: "1rem", borderRadius: 8, marginBottom: "0.8rem", border: "1px solid #334155" }}>
              <b style={{ color: "#a5b4fc" }}>Q{i + 1}: {ex.question}</b>
              <pre style={{ marginTop: "0.5rem" }}>{ex.solution}</pre>
            </div>
          ))}

          <h3>Shortcuts, Mental Math & Speed Hacks</h3>
          <ul>
            {lesson.shortcuts?.map((s, i) => <li key={i} style={{ color: "#fef08a", marginBottom: "0.4rem" }}>{s}</li>)}
          </ul>

          <h3>Real-World Corporate Application</h3>
          <p>{lesson.realWorld}</p>

          <h3>Common Pitfalls & Mistakes to Avoid</h3>
          <ul>
            {lesson.mistakes?.map((m, i) => <li key={i} style={{ color: "#fca5a5", marginBottom: "0.4rem" }}>{m}</li>)}
          </ul>

          <button onClick={onPractice} style={{ marginTop: "1.5rem" }}>Start Practice Quiz →</button>
        </div>
      )}
    </div>
  );
}

/* ==================== ADAPTIVE QUIZ & PRACTICE ==================== */
function Quiz({ initialTopic }) {
  const [topic, setTopic] = useState(initialTopic || "Percentage");
  const [difficulty, setDifficulty] = useState("medium");
  const [promptVersion, setPromptVersion] = useState("V3");

  const [qs, setQs] = useState(null);
  const [idx, setIdx] = useState(0);
  const [sel, setSel] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [start, setStart] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const startQuiz = async () => {
    if (!topic) return alert("Please enter or select an aptitude topic");
    setLoading(true);
    try {
      const { data } = await api.post("/quiz", { topic, difficulty, count: 5, promptVersion });
      if (data && Array.isArray(data.questions) && data.questions.length > 0) {
        setQs(data.questions);
        setIdx(0);
        setAnswers([]);
        setResult(null);
        setStart(Date.now());
      } else {
        alert("Could not load practice questions for " + topic + ". Please try again.");
      }
    } catch (e) {
      alert(e.response?.data?.msg || "Failed to generate practice quiz");
    }
    setLoading(false);
  };

  const nextQuestion = async () => {
    const timeTaken = Math.round((Date.now() - start) / 1000);
    const newAns = [...answers, { selected: sel, timeTaken }];

    if (idx + 1 < qs.length) {
      setAnswers(newAns);
      setIdx(idx + 1);
      setSel(null);
      setStart(Date.now());
    } else {
      setLoading(true);
      try {
        const { data } = await api.post("/attempt", { topic, difficulty, questions: qs, answers: newAns });
        setResult(data);
      } catch (e) {
        alert("Failed to submit quiz");
      }
      setLoading(false);
    }
  };

  if (loading) return <p>Preparing practice questions...</p>;

  if (!qs) return (
    <div className="card">
      <h2>Adaptive Practice Quiz</h2>
      <p>Test your conceptual speed and accuracy under timed conditions.</p>

      <div className="row">
        <div style={{ flex: 2 }}>
          <label>Topic</label>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic (e.g., Permutation)" />
        </div>
        <div style={{ flex: 1 }}>
          <label>Difficulty</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="easy">Easy (Foundations)</option>
            <option value="medium">Medium (Exam Level)</option>
            <option value="hard">Hard (Advanced / Trap Problems)</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label>Template Strategy</label>
          <select value={promptVersion} onChange={(e) => setPromptVersion(e.target.value)}>
            <option value="V3">Structured Step-by-Step Template</option>
            <option value="V2">Standard Detailed Template</option>
            <option value="V1">Concise Direct Template</option>
          </select>
        </div>
      </div>

      <button onClick={startQuiz}>Start 5-Question Quiz</button>
    </div>
  );

  if (result) return (
    <div className="card">
      <h2>Quiz Results & Diagnostic Report</h2>
      
      <div className="cards-row" style={{ marginTop: "1rem" }}>
        <div className="stat-box">
          <div className="label">Score</div>
          <div className="number">{result.score} / {result.total}</div>
        </div>
        <div className="stat-box">
          <div className="label">Accuracy</div>
          <div className="number" style={{ color: "#34d399" }}>{result.accuracy}%</div>
        </div>
        <div className="stat-box">
          <div className="label">Avg Speed</div>
          <div className="number" style={{ color: "#60a5fa" }}>{result.avgTime}s</div>
        </div>
      </div>

      <h3>Instructor Feedback & Strategy</h3>
      <p>{result.feedback?.encouragement}</p>

      {result.feedback?.weakTopics?.length > 0 && (
        <div>
          <h4>Identified Weak Concepts:</h4>
          <ul>
            {result.feedback.weakTopics.map((w, i) => <li key={i} style={{ color: "#fca5a5" }}>{w}</li>)}
          </ul>
        </div>
      )}

      <h4>3-Day Actionable Revision Plan:</h4>
      <ul>
        {result.feedback?.revisionPlan?.map((r, i) => <li key={i}>{r}</li>)}
      </ul>

      <h4>Per-Question Feedback & Explanations:</h4>
      {qs.map((q, i) => (
        <div key={i} style={{ background: "#0f172a", padding: "1rem", borderRadius: 8, marginBottom: "0.6rem" }}>
          <p><b>Q{i + 1}: {q.q}</b></p>
          <p style={{ color: answers[i]?.selected === q.answer ? "#34d399" : "#fca5a5" }}>
            Your answer: {q.options[answers[i]?.selected] || "Not answered"} — {answers[i]?.selected === q.answer ? "Correct" : `Incorrect (Correct: ${q.options[q.answer]})`}
          </p>
          <pre>{q.explanation}</pre>
        </div>
      ))}

      <button onClick={() => { setQs(null); setResult(null); }}>Take New Quiz</button>
    </div>
  );

  const q = qs[idx];
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Question {idx + 1} of {qs.length}</span>
        <span className="badge">{difficulty.toUpperCase()}</span>
      </div>

      <h3 style={{ margin: "1rem 0" }}>{q.q}</h3>

      {q.options.map((o, i) => (
        <label key={i} className={`opt ${sel === i ? "picked" : ""}`}>
          <input type="radio" checked={sel === i} onChange={() => setSel(i)} />
          {o}
        </label>
      ))}

      <button disabled={sel === null} onClick={nextQuestion} style={{ marginTop: "1rem" }}>
        {idx + 1 < qs.length ? "Next Question →" : "Submit Quiz"}
      </button>
    </div>
  );
}

/* ==================== MOCK TEST COMPONENT ==================== */
function MockTest() {
  const [qs, setQs] = useState(null);
  const [ans, setAns] = useState({});
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("Quantitative");

  const startTest = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/mocktest");
      setQs(data.questions);
      setTimeLeft(900);
      setResult(null);
      setAns({});
    } catch (e) {
      alert("Failed to generate mock test");
    }
    setLoading(false);
  };

  const submitTest = async () => {
    if (!qs) return;
    const answersArray = qs.map((q, i) => ({ selected: ans[i] ?? -1, timeTaken: 60 }));
    try {
      const { data } = await api.post("/attempt", { topic: "Placement Mock Test", difficulty: "medium", questions: qs, answers: answersArray });
      setResult(data);
    } catch (e) {
      alert("Failed to submit test");
    }
  };

  const submitRef = useRef(submitTest);
  submitRef.current = submitTest;

  useEffect(() => {
    if (!qs || result) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          submitRef.current();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [qs, result]);

  if (loading) return <p>Creating full-length placement mock test... (15 Questions, 5 Domains)</p>;

  if (!qs) return (
    <div className="card">
      <h2>Full-Length Placement Mock Test</h2>
      <p>Simulate official placement examination conditions: 15 questions across Quantitative, Logical, Verbal, DI, and Puzzles with a 15-minute timer.</p>
      <button onClick={startTest}>Start Placement Mock Test</button>
    </div>
  );

  if (result) return (
    <div className="card">
      <h2>Mock Test Final Performance</h2>
      
      <div className="cards-row" style={{ marginTop: "1rem" }}>
        <div className="stat-box">
          <div className="label">Score</div>
          <div className="number">{result.score} / {result.total}</div>
        </div>
        <div className="stat-box">
          <div className="label">Accuracy</div>
          <div className="number" style={{ color: "#34d399" }}>{result.accuracy}%</div>
        </div>
      </div>

      <h3>Diagnostic Feedback</h3>
      <p>{result.feedback?.encouragement}</p>
      
      <button onClick={() => { setQs(null); setResult(null); }}>Take Another Mock Test</button>
    </div>
  );

  const sections = ["Quantitative", "Logical Reasoning", "Verbal Ability", "Data Interpretation", "Puzzles"];

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>Placement Mock Test</h3>
        <h3 style={{ color: "#f87171", fontFamily: "monospace" }}>
          Time Remaining: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
        </h3>
      </div>

      <div className="chips" style={{ margin: "1rem 0" }}>
        {sections.map((sec) => (
          <span
            key={sec}
            className={`chip ${activeSection === sec ? "active" : ""}`}
            onClick={() => setActiveSection(sec)}
          >
            {sec}
          </span>
        ))}
      </div>

      {qs.map((q, i) => {
        if (q.section && q.section !== activeSection) return null;
        return (
          <div key={i} style={{ background: "#0f172a", padding: "1.2rem", borderRadius: 8, marginBottom: "1rem", border: "1px solid #334155" }}>
            <p><b>Q{i + 1} [{q.section}]: {q.q}</b></p>
            {q.options.map((o, j) => (
              <label key={j} className={`opt ${ans[i] === j ? "picked" : ""}`}>
                <input
                  type="radio"
                  name={`q${i}`}
                  checked={ans[i] === j}
                  onChange={() => setAns({ ...ans, [i]: j })}
                />
                {o}
              </label>
            ))}
          </div>
        );
      })}

      <button onClick={submitTest} style={{ marginTop: "1rem" }}>Submit Complete Mock Test</button>
    </div>
  );
}

/* ==================== COMPANY INTERVIEW PREP ==================== */
function InterviewPrep() {
  const COMPANIES = ["TCS NQT", "Infosys", "Wipro", "Amazon", "GATE", "CAT", "GRE", "Bank PO"];
  const [company, setCompany] = useState("TCS NQT");
  const [topic, setTopic] = useState("General Aptitude");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchInterviewQs = async () => {
    setLoading(true);
    try {
      const res = await api.post("/interview", { company, topic });
      setData(res.data);
    } catch (e) {
      alert("Failed to load interview questions");
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="card">
        <h2>Company-Specific Aptitude Interview Preparation</h2>
        <p>Master technical aptitude questions asked during corporate placement rounds.</p>

        <div className="row">
          <div style={{ flex: 1 }}>
            <label>Target Company / Exam</label>
            <select value={company} onChange={(e) => setCompany(e.target.value)}>
              {COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>Topic</label>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic (e.g., Puzzles, Ratios)" />
          </div>
          <button onClick={fetchInterviewQs}>{loading ? "Loading..." : "Get Interview Questions"}</button>
        </div>
      </div>

      {loading && <p>Loading company placement questions...</p>}

      {data && (
        <div className="card">
          <h2>Questions for {company} — {topic}</h2>
          {data.questions?.map((q, i) => (
            <div key={i} style={{ background: "#0f172a", padding: "1.2rem", borderRadius: 8, marginBottom: "1rem" }}>
              <b style={{ color: "#a5b4fc", fontSize: "1.1rem" }}>Q{i + 1}: {q.q}</b>
              <p style={{ color: "#fef08a", marginTop: "0.5rem" }}><b>Hint:</b> {q.hint}</p>
              <p><b>Answer:</b> {q.answer}</p>
              <pre>{q.explanation}</pre>
              <p style={{ color: "#a7f3d0", marginTop: "0.5rem" }}><b>Interviewer Verbal Tip:</b> {q.interviewTip}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ==================== AI CONVERSATIONAL COACH ==================== */
function AICoach() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! Welcome to your personal aptitude workspace. Ask any question, doubt, or formula shortcut!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async (textToSend) => {
    const msg = textToSend || input;
    if (!msg.trim()) return;

    const newMsgs = [...messages, { sender: "user", text: msg }];
    setMessages(newMsgs);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const history = newMsgs.map((m) => ({ role: m.sender === "user" ? "user" : "assistant", text: m.text }));
      const { data } = await api.post("/coach", { message: msg, history });
      setMessages([...newMsgs, { sender: "bot", text: data.reply, followUps: data.suggestedFollowUps }]);
    } catch (e) {
      setMessages([...newMsgs, { sender: "bot", text: "Sorry, I had trouble generating a response. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <div className="card">
      <h2>Personal Aptitude Instructor</h2>
      <p>Interactive doubt resolution, mathematical derivations, and speed tips.</p>

      <div className="chat-container">
        <div className="chat-history">
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg ${m.sender}`}>
              <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
              {m.followUps && (
                <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  {m.followUps.map((f, j) => (
                    <button key={j} className="btn-secondary" style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }} onClick={() => send(f)}>
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && <div className="chat-msg bot">Instructor is preparing answer...</div>}
        </div>

        <div className="chat-input">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask any question (e.g., Explain Time & Work formula)..."
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button onClick={() => send()}>Send</button>
        </div>
      </div>
    </div>
  );
}

/* ==================== PROMPT ENGINEERING WORKBENCH ==================== */
function PromptWorkbench() {
  const [type, setType] = useState("lesson");
  const [topic, setTopic] = useState("Percentage");
  const [difficulty, setDifficulty] = useState("medium");
  const [compData, setCompData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Custom runner state
  const [sysPrompt, setSysPrompt] = useState("You are an expert quantitative trainer. Return JSON.");
  const [userPrompt, setUserPrompt] = useState("Generate a 3-step formula guide on Probability.");
  const [customResult, setCustomResult] = useState(null);
  const [customLoading, setCustomLoading] = useState(false);

  const runComparison = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/prompts/compare", { type, topic, difficulty });
      setCompData(data);
    } catch (e) {
      alert("Prompt comparison failed");
    }
    setLoading(false);
  };

  const runCustomPrompt = async () => {
    setCustomLoading(true);
    try {
      const { data } = await api.post("/prompts/run", { systemPrompt: sysPrompt, userPrompt });
      setCustomResult(data);
    } catch (e) {
      alert("Custom prompt execution failed");
    }
    setCustomLoading(false);
  };

  return (
    <div>
      <div className="card">
        <h2>Prompt Workbench</h2>
        <p>Compare content generation templates side-by-side to evaluate clarity, structure, and depth.</p>

        <div className="row">
          <div style={{ flex: 1 }}>
            <label>Stage / Feature</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="lesson">Concept Lesson Generation</option>
              <option value="quiz">Adaptive Quiz Generation</option>
              <option value="roadmap">Study Roadmap Generation</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>Topic</label>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <button onClick={runComparison}>{loading ? "Running Comparison..." : "Run Side-by-Side Comparison"}</button>
        </div>
      </div>

      {loading && <p>Comparing template strategies...</p>}

      {compData && (
        <div className="workbench-grid">
          <div className="version-card v1">
            <div className="version-header">
              <h3>V1: Direct Template</h3>
              <span className="badge">{compData.v1.timeMs} ms</span>
            </div>
            <p><b>Strategy:</b> Direct basic prompt asking for structured output.</p>
            <h4>Full Raw Prompt:</h4>
            <pre>{compData.v1.prompt}</pre>
            <h4>Generated Result:</h4>
            <pre>{JSON.stringify(compData.v1.result, null, 2)}</pre>
          </div>

          <div className="version-card v2">
            <div className="version-header">
              <h3>V2: Standard Template</h3>
              <span className="badge">{compData.v2.timeMs} ms</span>
            </div>
            <p><b>Strategy:</b> Role definition + structured JSON schema.</p>
            <h4>Full Raw Prompt:</h4>
            <pre>{compData.v2.prompt}</pre>
            <h4>Generated Result:</h4>
            <pre>{JSON.stringify(compData.v2.result, null, 2)}</pre>
          </div>

          <div className="version-card v3">
            <div className="version-header">
              <h3>V3: Step-by-Step Template</h3>
              <span className="badge">{compData.v3.timeMs} ms</span>
            </div>
            <p><b>Strategy:</b> Few-shot exemplar + step-by-step guidance.</p>
            <h4>Full Raw Prompt:</h4>
            <pre>{compData.v3.prompt}</pre>
            <h4>Generated Result:</h4>
            <pre>{JSON.stringify(compData.v3.result, null, 2)}</pre>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: "2rem" }}>
        <h2>Custom Template Playground</h2>
        <label>System Instructions</label>
        <input value={sysPrompt} onChange={(e) => setSysPrompt(e.target.value)} />
        <label>User Prompt</label>
        <textarea value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} rows="3" />
        <button onClick={runCustomPrompt}>{customLoading ? "Executing..." : "Execute Custom Template"}</button>

        {customResult && (
          <div style={{ marginTop: "1rem" }}>
            <h4>Execution Output ({customResult.timeMs} ms):</h4>
            <pre>{JSON.stringify(customResult.result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==================== PERFORMANCE DASHBOARD & PDF REPORT ==================== */
function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/stats")
      .then((r) => setStats(r.data))
      .catch(() => setStats(null));
  }, []);

  if (!stats) return <p>Loading performance dashboard...</p>;

  return (
    <div>
      <div className="card">
        <h2>Learner Analytics & Performance Dashboard</h2>
        <p>Comprehensive competency breakdown, topic-wise accuracy, speed metrics, and percentile estimations.</p>

        <div className="cards-row" style={{ marginTop: "1.5rem" }}>
          <div className="stat-box">
            <div className="label">Tests Taken</div>
            <div className="number">{stats.testsTaken}</div>
          </div>
          <div className="stat-box">
            <div className="label">Overall Accuracy</div>
            <div className="number" style={{ color: "#34d399" }}>{stats.overallAccuracy}%</div>
          </div>
          <div className="stat-box">
            <div className="label">Avg Speed</div>
            <div className="number" style={{ color: "#60a5fa" }}>{stats.avgSpeedSec}s</div>
          </div>
          <div className="stat-box">
            <div className="label">Est. Percentile</div>
            <div className="number" style={{ color: "#c084fc" }}>{stats.estimatedPercentile}th</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Achievement Badges Earned</h3>
        <div className="chips">
          {stats.badges?.length > 0 ? (
            stats.badges.map((b, i) => (
              <span key={i} className="badge" style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}>
                {b.name} — <small>{b.desc}</small>
              </span>
            ))
          ) : (
            <p>Complete tests to unlock achievement badges!</p>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Competency Matrix & Topic Accuracy</h3>
        {stats.competencyReport?.length === 0 && <p>No topic attempts recorded yet.</p>}
        {stats.competencyReport?.map((c, i) => (
          <div key={i} style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span><b>{c.topic}</b> ({c.correct}/{c.attempted} correct • {c.avgSpeedSec}s/q)</span>
              <span className="badge">{c.competencyLevel} ({c.accuracy}%)</span>
            </div>
            <div className="bar-container">
              <div className="bar-fill" style={{ width: `${c.accuracy}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Recent Practice Attempts</h3>
        {stats.recent?.length === 0 && <p>No recent attempts.</p>}
        {stats.recent?.map((a) => (
          <div key={a._id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #1e293b" }}>
            <span><b>{a.topic}</b> ({a.difficulty})</span>
            <span>Score: {a.score}/{a.questions?.length || a.answers?.length} ({a.accuracy}%) — {new Date(a.createdAt).toLocaleDateString()}</span>
          </div>
        ))}

        <button onClick={() => window.print()} style={{ marginTop: "1.5rem" }}>
          Download Printable Preparation Report (PDF)
        </button>
      </div>
    </div>
  );
}
