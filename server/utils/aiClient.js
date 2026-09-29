require("dotenv").config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

/**
 * Clean JSON output from text response
 */
function cleanJSON(text) {
  if (!text) return {};
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  cleaned = cleaned.trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
    }
    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      return JSON.parse(cleaned.substring(firstBracket, lastBracket + 1));
    }
    throw new Error("Failed to parse valid JSON from response");
  }
}

/**
 * Call Gemini AI API with system instructions enforcing real data and focused examples
 */
async function callAI(prompt, systemInstruction = null) {
  const defaultSystem =
    "You are an experienced human aptitude professor and placement author. " +
    "ALWAYS explain concepts using REAL placement exam data, authentic numbers, and focused step-by-step solved examples. " +
    "Use clear, simple English words without fluff. Never refer to yourself as an AI. " +
    "Do not use any emojis. Always return ONLY valid JSON.";

  if (!GEMINI_API_KEY) {
    console.warn("⚠️ GEMINI_API_KEY missing in .env. Using topic-focused fallback generator.");
    return generateFallback(prompt);
  }

  try {
    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: (systemInstruction ? systemInstruction + "\n\n" : defaultSystem + "\n\n") + prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    };

    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn("Gemini API call failed, using fallback generator.");
      return generateFallback(prompt);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return cleanJSON(text);
  } catch (err) {
    console.warn("API Exception:", err.message, "-> Falling back to topic-focused local generator.");
    return generateFallback(prompt);
  }
}

/**
 * Topic Knowledge Base with Real Exam Concepts, Formulas, & Focused Solved Examples
 */
const TOPIC_KNOWLEDGE = {
  "number system": {
    concept: "Number System forms the foundation of quantitative aptitude. It deals with properties of numbers, divisibility rules, unit digits, remainders, and prime factorization required in placement rounds like TCS and Infosys.",
    visualization: "+-------------------------------------------+\n| NUMBER SYSTEM SPECTRUM                    |\n+-------------------------------------------+\n| Natural Numbers (1, 2, 3...)              |\n| Whole Numbers   (0, 1, 2, 3...)           |\n| Integers        (-2, -1, 0, 1, 2...)     |\n| Rational        (p/q format, q != 0)     |\n+-------------------------------------------+",
    formulas: [
      "Sum of first N natural numbers = N * (N + 1) / 2",
      "Sum of squares of first N natural numbers = N * (N + 1) * (2N + 1) / 6",
      "Dividend = (Divisor * Quotient) + Remainder"
    ],
    examples: [
      {
        question: "Find the sum of the first 20 natural numbers.",
        solution: "Step 1: Identify N = 20.\nStep 2: Apply sum formula = N * (N + 1) / 2.\nStep 3: Calculate = 20 * 21 / 2 = 210.\nFinal Answer: 210."
      },
      {
        question: "What is the remainder when 2^31 is divided by 5?",
        solution: "Step 1: Find the cyclicity of powers of 2 mod 5: 2^1=2, 2^2=4, 2^3=3, 2^4=1 (cycle length = 4).\nStep 2: Divide power 31 by cycle 4: 31 = 4 * 7 + 3 (remainder is 3).\nStep 3: Calculate 2^3 mod 5 = 8 mod 5 = 3.\nFinal Answer: Remainder is 3."
      }
    ],
    shortcuts: [
      "Divisibility by 3: Sum of all digits must be divisible by 3.",
      "Divisibility by 4: Last two digits of the number must be divisible by 4.",
      "Divisibility by 11: Difference between sum of odd position digits and even position digits must be 0 or divisible by 11."
    ],
    realWorld: "Used in data encryption, hash functions, computer memory address calculations, and checksum algorithms.",
    mistakes: [
      "Confusing prime numbers with odd numbers (2 is an even prime).",
      "Forgetting that 0 is neither positive nor negative.",
      "Miscalculating negative remainders."
    ]
  },
  "percentage": {
    concept: "Percentage is a ratio expressed as a fraction of 100. It is the core concept used across Profit & Loss, Data Interpretation, Simple & Compound Interest, and corporate performance metrics.",
    visualization: "+---------------------------------------+\n| PERCENTAGE CONVERSION MATRIX          |\n+---------------------------------------+\n| Fraction  ---> Decimal ---> Percentage|\n| 1/2       ---> 0.50    ---> 50%       |\n| 1/4       ---> 0.25    ---> 25%       |\n| 1/8       ---> 0.125   ---> 12.5%     |\n+---------------------------------------+",
    formulas: [
      "Percentage = (Part Value / Total Base Value) * 100",
      "Percentage Increase = (Final Value - Initial Value) / Initial Value * 100",
      "Effective Rate of Net Change = A + B + (A * B / 100)"
    ],
    examples: [
      {
        question: "An item marked at $800 is sold for $640. What is the discount percentage?",
        solution: "Step 1: Calculate Discount Amount = $800 - $640 = $160.\nStep 2: Apply Discount % formula = (Discount / Marked Price) * 100.\nStep 3: Calculate = (160 / 800) * 100 = 1/5 * 100 = 20%.\nFinal Answer: 20% Discount."
      },
      {
        question: "The salary of an employee increases by 10% and then decreases by 10%. What is the net percentage change in salary?",
        solution: "Step 1: Use net change formula A + B + (A*B/100) where A = +10 and B = -10.\nStep 2: Calculate = 10 - 10 + (10 * -10 / 100) = 0 - 1 = -1%.\nFinal Answer: Salary decreases by 1%."
      }
    ],
    shortcuts: [
      "10% of any number = shift decimal point 1 place left (e.g. 10% of 450 is 45).",
      "5% of a number = half of 10%.",
      "25% of a number = divide the number by 4."
    ],
    realWorld: "Used in corporate revenue growth metrics, salary hikes, tax calculations, and market share analysis.",
    mistakes: [
      "Calculating percentage change using the final value as base instead of original initial value.",
      "Assuming a 10% increase followed by a 10% decrease leaves the original value unchanged."
    ]
  },
  "profit and loss": {
    concept: "Profit and Loss deals with financial calculations involving Cost Price (CP), Selling Price (SP), Marked Price (MP), and Discount percentage in commercial arithmetic.",
    visualization: "+---------------------------------------+\n| COMMERCIAL ARITHMETIC CHAIN           |\n+---------------------------------------+\n| Cost Price (CP) + Profit = Selling Price (SP) |\n| Marked Price (MP) - Discount = Selling Price (SP)|\n+---------------------------------------+",
    formulas: [
      "Profit = Selling Price (SP) - Cost Price (CP)",
      "Profit Percentage = (Profit / Cost Price) * 100",
      "Selling Price = Cost Price * (100 + Profit %) / 100"
    ],
    examples: [
      {
        question: "A trader buys a mobile for $12,000 and sells it for $15,000. Calculate the profit percentage.",
        solution: "Step 1: Calculate Profit = $15,000 - $12,000 = $3,000.\nStep 2: Apply Profit % = (Profit / CP) * 100 = (3,000 / 12,000) * 100.\nStep 3: Simplify = 1/4 * 100 = 25%.\nFinal Answer: 25% Profit."
      },
      {
        question: "By selling a watch for $1,800, a shopkeeper loses 10%. What was the Cost Price?",
        solution: "Step 1: SP = CP * (100 - Loss %) / 100.\nStep 2: 1,800 = CP * (90 / 100).\nStep 3: CP = 1,800 * 100 / 90 = $2,000.\nFinal Answer: Cost Price was $2,000."
      }
    ],
    shortcuts: [
      "If SP of X items equals CP of Y items, Profit % = ((Y - X) / X) * 100.",
      "If two items are sold at the same price, one at X% profit and other at X% loss, net loss = (X^2 / 100)%."
    ],
    realWorld: "Used in retail pricing strategies, corporate balance sheets, margin analysis, and e-commerce discounts.",
    mistakes: [
      "Calculating profit percentage over Selling Price instead of Cost Price.",
      "Applying discount percentage to Cost Price instead of Marked Price."
    ]
  },
  "time and work": {
    concept: "Time and Work measures the relationship between rate of work, number of workers, time taken, and total work completed. It is a staple topic in TCS, Wipro, and Accenture tests.",
    visualization: "+-------------------------------------------+\n| WORK EFFICIENCY EQUATION                  |\n+-------------------------------------------+\n| Total Work = Rate of Work (Units/Day) * Days |\n| Person A (1/10 per day) + Person B (1/15) |\n| Combined Rate = 1/10 + 1/15 = 1/6 per day |\n+-------------------------------------------+",
    formulas: [
      "Work Done = Rate of Work * Time",
      "If A can complete a work in N days, A's 1 day work = 1 / N",
      "Combined Days for A (a days) and B (b days) = (a * b) / (a + b)"
    ],
    examples: [
      {
        question: "A can complete a job in 10 days and B can complete it in 15 days. How long will they take working together?",
        solution: "Step 1: A's 1 day work = 1/10. B's 1 day work = 1/15.\nStep 2: Combined 1 day work = 1/10 + 1/15 = (3 + 2) / 30 = 5/30 = 1/6.\nStep 3: Days needed = 1 / (1/6) = 6 days.\nFinal Answer: 6 days."
      },
      {
        question: "12 men can build a wall in 8 days. How many men are needed to build the wall in 6 days?",
        solution: "Step 1: Apply formula M1 * D1 = M2 * D2.\nStep 2: 12 * 8 = M2 * 6.\nStep 3: 96 = 6 * M2 => M2 = 16 men.\nFinal Answer: 16 men."
      }
    ],
    shortcuts: [
      "LCM Method: Assume Total Work = LCM of individual days to work with simple whole integers.",
      "If efficiency of A is twice B, A takes half the time of B."
    ],
    realWorld: "Used in project management, software sprint planning, construction scheduling, and team resource allocation.",
    mistakes: [
      "Adding days directly (10 days + 15 days != 25 days). Always add work rates (1/10 + 1/15).",
      "Forgetting to invert the 1-day work rate to find total days."
    ]
  },
  "time, speed and distance": {
    concept: "Time, Speed and Distance analyzes motion, relative speed, train problems, and river stream calculations. Speed measures the distance covered per unit time.",
    visualization: "+-------------------------------------------+\n| MOTION TRIANGLE                           |\n+-------------------------------------------+\n| Distance = Speed * Time                   |\n| Speed    = Distance / Time                |\n| Time     = Distance / Speed                |\n+-------------------------------------------+",
    formulas: [
      "Speed = Distance / Time",
      "Convert km/h to m/s = Multiply by (5 / 18)",
      "Convert m/s to km/h = Multiply by (18 / 5)",
      "Relative Speed (Opposite Direction) = S1 + S2",
      "Relative Speed (Same Direction) = S1 - S2"
    ],
    examples: [
      {
        question: "A train 180 meters long passes a telegraph pole in 9 seconds. What is the speed of the train in km/h?",
        solution: "Step 1: Speed in m/s = Distance / Time = 180m / 9s = 20 m/s.\nStep 2: Convert m/s to km/h = 20 * (18 / 5) = 4 * 18 = 72 km/h.\nFinal Answer: 72 km/h."
      },
      {
        question: "Two cars start from points A and B 200 km apart towards each other at 60 km/h and 40 km/h. When will they meet?",
        solution: "Step 1: Relative speed (opposite direction) = 60 + 40 = 100 km/h.\nStep 2: Time to meet = Distance / Relative Speed = 200 / 100 = 2 hours.\nFinal Answer: 2 hours."
      }
    ],
    shortcuts: [
      "If distance is constant, Speed ratio S1:S2 is inversely proportional to Time ratio T2:T1.",
      "Average Speed for equal distances covered at S1 and S2 = (2 * S1 * S2) / (S1 + S2)."
    ],
    realWorld: "Used in logistics planning, GPS route estimation, airline scheduling, and network packet latency calculations.",
    mistakes: [
      "Mixing distance units (km) with time units (seconds) without unit conversion.",
      "Adding speeds when moving in the same direction instead of subtracting."
    ]
  }
};

/**
 * Fallback generator written with real placement exam data and focused examples
 */
function generateFallback(prompt) {
  const pLower = prompt.toLowerCase();

  // Roadmap fallback
  if (
    pLower.includes("roadmap") ||
    pLower.includes("study plan") ||
    pLower.includes("milestone") ||
    pLower.includes("preparation period") ||
    pLower.includes("learner profile") ||
    (pLower.includes("weeks") && pLower.includes("topics"))
  ) {
    return {
      weeks: [
        {
          week: 1,
          milestone: "Quantitative Foundations & Number Sense",
          topics: [
            { name: "Number System", domain: "Quantitative", difficulty: "easy", hours: 4 },
            { name: "Percentage", domain: "Quantitative", difficulty: "easy", hours: 4 }
          ],
          assessment: "Topic Test 1: Percentages & Number Properties"
        },
        {
          week: 2,
          milestone: "Commercial Arithmetic & Ratio Calculations",
          topics: [
            { name: "Profit and Loss", domain: "Quantitative", difficulty: "medium", hours: 5 },
            { name: "Ratio and Proportion", domain: "Quantitative", difficulty: "easy", hours: 3 }
          ],
          assessment: "Section Test: Commercial Arithmetic"
        },
        {
          week: 3,
          milestone: "Time, Speed & Work Dynamics",
          topics: [
            { name: "Time and Work", domain: "Quantitative", difficulty: "medium", hours: 5 },
            { name: "Time, Speed and Distance", domain: "Quantitative", difficulty: "medium", hours: 5 }
          ],
          assessment: "Speed & Work Benchmark Checkpoint"
        },
        {
          week: 4,
          milestone: "Logical Reasoning & Analytical Structures",
          topics: [
            { name: "Coding-Decoding", domain: "Logical", difficulty: "easy", hours: 3 },
            { name: "Blood Relations", domain: "Logical", difficulty: "easy", hours: 3 },
            { name: "Seating Arrangement", domain: "Logical", difficulty: "medium", hours: 4 }
          ],
          assessment: "Mid-Term Analytical Assessment"
        },
        {
          week: 5,
          milestone: "Permutations & Probability",
          topics: [
            { name: "Permutation and Combination", domain: "Quantitative", difficulty: "hard", hours: 6 },
            { name: "Probability", domain: "Quantitative", difficulty: "medium", hours: 4 }
          ],
          assessment: "Combinatorics Practice Test"
        },
        {
          week: 6,
          milestone: "Data Interpretation & Chart Analysis",
          topics: [
            { name: "Data Interpretation", domain: "Data Interpretation", difficulty: "medium", hours: 6 },
            { name: "Puzzles", domain: "Analytical", difficulty: "hard", hours: 4 }
          ],
          assessment: "DI & Chart Reading Practice Drill"
        },
        {
          week: 7,
          milestone: "Verbal Ability & Critical Reasoning",
          topics: [
            { name: "Verbal Ability", domain: "Verbal", difficulty: "easy", hours: 4 },
            { name: "Analytical Reasoning", domain: "Logical", difficulty: "medium", hours: 4 }
          ],
          assessment: "Verbal & Logic Practice Check"
        },
        {
          week: 8,
          milestone: "Full Placement Practice & Exam Readiness",
          topics: [
            { name: "Simple and Compound Interest", domain: "Quantitative", difficulty: "medium", hours: 4 },
            { name: "Full Placement Practice", domain: "Mixed", difficulty: "hard", hours: 6 }
          ],
          assessment: "Grand Placement Mock Test"
        }
      ]
    };
  }

  // Quiz & Mock Test fallback (Checked BEFORE lesson)
  if (
    pLower.includes("mcq") ||
    pLower.includes("quiz") ||
    pLower.includes("multiple-choice") ||
    pLower.includes("practice questions") ||
    pLower.includes("aptitude exam author") ||
    pLower.includes("mock test") ||
    pLower.includes("mocktest") ||
    pLower.includes("5 sections")
  ) {
    let topicMatch = prompt.match(/topic ["']?([^"'\n,]+)["']?/i) || prompt.match(/on ["']?([^"'\n,]+)["']?/i);
    let topic = topicMatch ? topicMatch[1] : "Quantitative Aptitude";

    return {
      questions: [
        {
          q: "A car covers 300 kilometers in 4 hours. What is its speed in km/h?",
          options: ["60 km/h", "75 km/h", "80 km/h", "90 km/h"],
          answer: 1,
          explanation: "Step 1: Formula Speed = Distance / Time.\nStep 2: Speed = 300 km / 4 hours = 75 km/h.\nSo option 1 (75 km/h) is correct.",
          conceptTag: topic
        },
        {
          q: "If 20% of a number is 50, what is 50% of that number?",
          options: ["100", "125", "150", "200"],
          answer: 1,
          explanation: "Step 1: Let the number be X. 0.20 * X = 50 => X = 250.\nStep 2: Calculate 50% of 250 = 0.50 * 250 = 125.\nSo option 1 (125) is correct.",
          conceptTag: topic
        },
        {
          q: "A worker completes a job in 12 days. What fraction of the job is completed in 3 days?",
          options: ["1/4", "1/3", "1/2", "1/6"],
          answer: 0,
          explanation: "Step 1: 1 day work = 1/12.\nStep 2: 3 days work = 3 * (1/12) = 3/12 = 1/4.\nSo option 0 (1/4) is correct.",
          conceptTag: topic
        },
        {
          q: "In how many distinct ways can the letters of the word 'CAT' be arranged?",
          options: ["3", "6", "9", "12"],
          answer: 1,
          explanation: "Step 1: Number of letters N = 3.\nStep 2: Number of arrangements = 3! = 3 * 2 * 1 = 6.\nSo option 1 (6) is correct.",
          conceptTag: topic
        },
        {
          q: "Two dice are thrown together. What is the probability that the sum of the numbers is 7?",
          options: ["1/6", "1/12", "5/36", "7/36"],
          answer: 0,
          explanation: "Step 1: Total outcomes = 6 * 6 = 36.\nStep 2: Favorable pairs for sum = 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) = 6 pairs.\nStep 3: Probability = 6 / 36 = 1/6.\nSo option 0 (1/6) is correct.",
          conceptTag: topic
        }
      ]
    };
  }

  // Lesson fallback
  if (pLower.includes("curriculum author") || pLower.includes("textbook lesson") || pLower.includes("fundamental concept") || pLower.includes("lesson")) {
    let topicMatch = prompt.match(/topic ["']?([^"'\n,]+)["']?/i) || prompt.match(/on ["']?([^"'\n,]+)["']?/i);
    let rawTopic = topicMatch ? topicMatch[1].trim().toLowerCase() : "percentage";
    
    let matchedData = TOPIC_KNOWLEDGE[rawTopic] || TOPIC_KNOWLEDGE["percentage"];

    return {
      concept: matchedData.concept,
      visualization: matchedData.visualization,
      formulas: matchedData.formulas,
      examples: matchedData.examples,
      shortcuts: matchedData.shortcuts,
      realWorld: matchedData.realWorld,
      mistakes: matchedData.mistakes
    };
  }

  // Interview questions fallback
  if (pLower.includes("interview") || pLower.includes("company")) {
    return {
      company: "TCS / Placement Technical Round",
      topic: "Aptitude Scenarios",
      questions: [
        {
          q: "What is the angle between the hour and minute hands of a clock at 3:15?",
          hint: "Minute hand is at 90 degrees. Hour hand moves 0.5 degrees per minute.",
          answer: "7.5 degrees",
          explanation: "Step 1: At 3:00, angle is 90 degrees.\nStep 2: In 15 minutes, minute hand moves 90 degrees (points to 3).\nStep 3: Hour hand moves 15 * 0.5 = 7.5 degrees past 3.\nStep 4: Difference = 7.5 degrees.",
          interviewTip: "State upfront that the hour hand moves continuously 0.5 degrees per minute."
        },
        {
          q: "You have 8 balls. 7 weigh the same and 1 is heavier. What is the minimum weighings on a balance scale to find the heavy ball?",
          hint: "Divide balls into 3 groups: 3, 3, 2.",
          answer: "2 weighings",
          explanation: "Step 1: Weigh group of 3 vs 3.\nStep 2: If equal, heavy ball is in remaining 2 (weigh 1 vs 1).\nStep 3: If unequal, take the heavier group of 3 and weigh 1 vs 1.\nTotal weighings needed = 2.",
          interviewTip: "State the grouping strategy (3, 3, 2) first before executing the weighing steps."
        }
      ]
    };
  }

  // Feedback fallback
  if (pLower.includes("encouragement") || pLower.includes("attempt") || pLower.includes("coach")) {
    return {
      encouragement: "Good effort! Regular practice with focused step-by-step problem solving builds placement speed.",
      weakTopics: ["Time, Speed and Distance", "Permutations"],
      revisionPlan: [
        "Day 1: Practice speed conversions (km/h to m/s by multiplying by 5/18).",
        "Day 2: Solve 5 solved examples on time and work LCM method.",
        "Day 3: Take a 5-minute timed quiz on percentage change."
      ],
      recommendedStrategy: "Spend 15 seconds identifying the problem type before starting calculations.",
      perQuestionFeedback: [
        { verdict: "correct", tip: "Great accuracy on ratio setup." },
        { verdict: "wrong", tip: "Remember: Speed = Distance / Time. Watch out for unit conversions." }
      ]
    };
  }

  // Coach chat fallback
  if (pLower.includes("apty") || pLower.includes("query") || pLower.includes("reply")) {
    return {
      reply: "Welcome to your personal aptitude workspace. Here are 3 key strategies for placement exams:\n\n1. **Master Core Formulas**: Learn standard formulas for percentages, ratios, and work rates.\n2. **Use Step-by-Step Setup**: Always write down Given Values, Formula, and Step 1-2-3 calculations.\n3. **Practice Timed Drills**: Build speed after ensuring 100% conceptual accuracy.\n\nWhich topic would you like to explore today?",
      suggestedFollowUps: [
        "Explain Time and Work LCM method",
        "Give me a step-by-step example on Percentage",
        "How do I solve train speed questions?"
      ]
    };
  }

  return { message: "Fallback generated with real placement data", data: prompt };
}

module.exports = { callAI, cleanJSON };
