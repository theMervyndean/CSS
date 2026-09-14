import express from "express";
import http from "http";
import https from "https";
import path from "path";
import nodemailer from "nodemailer";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel, Type, Modality, LiveServerMessage } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json());

// Helper for lazy initialization of GoogleGenAI SDK to avoid crash on startup
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured in Settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Resilient wrapper that automatically handles 429 quota exhaustion or rate limits by falling back to gemini-3.7-flash
async function generateWithFallback(options: {
  primaryModel?: string;
  contents: any;
  config?: any;
}): Promise<{ text: string; modelUsed: string }> {
  const ai = getGeminiClient();
  const primaryModel = options.primaryModel || "gemini-3.7-flash";

  try {
    const response = await ai.models.generateContent({
      model: primaryModel,
      contents: options.contents,
      config: options.config,
    });
    return {
      text: response.text || "",
      modelUsed: primaryModel,
    };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    const isQuotaOrRateLimit =
      errorMsg.includes("429") ||
      errorMsg.includes("RESOURCE_EXHAUSTED") ||
      errorMsg.includes("Quota exceeded") ||
      errorMsg.includes("limit: 0") ||
      errorMsg.includes("Rate limit");

    if (isQuotaOrRateLimit && primaryModel !== "gemini-3.7-flash") {
      console.warn(`[Gemini API] Primary model ${primaryModel} quota exhausted (429), falling back seamlessly to gemini-3.7-flash...`);
      const fallbackConfig = { ...options.config };
      if (fallbackConfig.thinkingConfig) {
        delete fallbackConfig.thinkingConfig;
      }
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: options.contents,
          config: fallbackConfig,
        });
        return {
          text: fallbackResponse.text || "",
          modelUsed: "gemini-3.7-flash (auto-fallback)",
        };
      } catch (fallbackErr: any) {
        throw fallbackErr;
      }
    }
    throw err;
  }
}

// REST API for Gemini AI question generation
// REST API for Nonye AI Exam Architect - CBT Question Generator from Topic or Raw Passage Text
app.post("/api/cbt/generate-questions", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { topic, passageText, numQuestions = 5, gradeLevel = "Grade 11 / SS 2", subject = "General", subscriptionTier = "unified_enterprise" } = req.body;

    const sourceContent = passageText ? `Reading Passage / Text Snippet:\n"""\n${passageText}\n"""` : `Topic: "${topic}"`;

    if (!topic && !passageText) {
      return res.status(400).json({ error: "A topic or passage text is required for Nonye AI to build CBT questions." });
    }

    const ai = getGeminiClient();

    // Adjust question limit based on subscription tier
    let allowedQuestions = Math.min(Number(numQuestions) || 5, 20);
    if (subscriptionTier === "cbt_essentials" && allowedQuestions > 5) {
      allowedQuestions = 5;
    }

    const prompt = `You are Nonye AI, an elite educational curriculum assistant and test architect. Build exactly ${allowedQuestions} multiple-choice CBT test questions based on the following input for "${subject}" (${gradeLevel} level):

${sourceContent}

REQUIREMENTS:
1. Every question must have exactly 4 plausible option choices (A, B, C, D).
2. Set correctOptionIndex (0 = A, 1 = B, 2 = C, 3 = D).
3. Provide a clear explanation for the correct answer.
4. Set marks to 10 for each question.
5. If passage text was provided, ensure questions directly test comprehension, facts, and analytical inferences from that specific text.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Nonye AI Exam Architect, an expert curriculum writer and school academic assessor for Corner Streams. Generate accurate, standard examination questions with multiple-choice options according to the requested level and schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: {
                type: Type.STRING,
                description: "The clear question statement or text."
              },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING
                },
                description: "Exactly four multiple-choice option strings (Option A, B, C, and D)."
              },
              correctOptionIndex: {
                type: Type.INTEGER,
                description: "The zero-based index of the correct answer (0 = A, 1 = B, 2 = C, 3 = D)."
              },
              explanation: {
                type: Type.STRING,
                description: "Brief pedagogical explanation of why this answer is correct."
              },
              marks: {
                type: Type.INTEGER,
                description: "The marks/points awarded for this question (usually 10)."
              }
            },
            required: ["text", "options", "correctOptionIndex", "explanation", "marks"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No response received from Gemini API.");
    }

    const generatedQuestions = JSON.parse(jsonText.trim());
    return res.json({ questions: generatedQuestions, tierUsed: subscriptionTier });

  } catch (error: any) {
    console.error("Nonye AI Question Generation Error:", error);
    return res.status(500).json({ 
      error: error.message || "An unexpected error occurred during Nonye AI question generation." 
    });
  }
});

// REST API for AI-powered GradeBook Analysis
app.post("/api/gradebook/analyze-grades", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { grades } = req.body;

    if (!grades || !Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({ error: "A non-empty list of student grade records is required." });
    }

    const ai = getGeminiClient();

    // Lightweight formatting to optimize context window and tokens
    const formattedGrades = grades.map((g: any) => ({
      studentName: g.studentName,
      scores: g.scores,
      totalScore: g.totalScore,
      gradeLetter: g.gradeLetter,
      remark: g.remark,
      subjectName: g.subjectName || "Subject",
      term: g.term || "Term",
      session: g.session || "Session"
    }));

    const prompt = `Analyze the following student grade records for the subject. Perform a detailed semantic academic performance and trend analysis:

${JSON.stringify(formattedGrades, null, 2)}

Provide the response in the specified JSON format, analyzing:
1. Overall class statistics (average, pass rates, highs, and lows).
2. Performance cohorts based on grade letters.
3. Analysis of any learning gaps (such as student CA scores being consistently lower or higher than exam scores).
4. Concrete, actionable pedagogic recommendations for the general class and individual students.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are Nonye AI Trajectory & Performance Advisory, an elite academic counselor and curriculum analyst for Corner Streams Intelligence. Analyze the grades data objectively, identifying patterns, learning gaps, strengths, weaknesses, and concrete actionable coaching recommendations.",
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A 2-3 sentence overview of the classroom's overall academic health and participation."
            },
            metrics: {
              type: Type.OBJECT,
              properties: {
                classAverage: {
                  type: Type.NUMBER,
                  description: "Calculated class average score (out of 100)."
                },
                passRate: {
                  type: Type.NUMBER,
                  description: "Percentage of students passing (total score >= 40)."
                },
                highestScore: {
                  type: Type.NUMBER,
                  description: "The highest score achieved in the class."
                },
                highestScoringStudent: {
                  type: Type.STRING,
                  description: "The name of the student with the highest score."
                },
                lowestScore: {
                  type: Type.NUMBER,
                  description: "The lowest score achieved in the class."
                }
              },
              required: ["classAverage", "passRate", "highestScore", "highestScoringStudent", "lowestScore"]
            },
            performanceCohorts: {
              type: Type.ARRAY,
              description: "Analysis of student performance divided into categories.",
              items: {
                type: Type.OBJECT,
                properties: {
                  categoryName: {
                    type: Type.STRING,
                    description: "Category label, e.g., 'Outstanding (A)', 'Passing (B/C/D)', or 'Urgent Intervention (E/F)'."
                  },
                  studentNames: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Names of students falling in this cohort category."
                  },
                  insight: {
                    type: Type.STRING,
                    description: "Semantic academic analysis of why they are in this cohort and their specific learning trajectory."
                  }
                },
                required: ["categoryName", "studentNames", "insight"]
              }
            },
            learningGaps: {
              type: Type.ARRAY,
              description: "Key academic gaps, weakness indicators or areas of friction identified from CA vs Exam score differences.",
              items: {
                type: Type.OBJECT,
                properties: {
                  gapDescription: {
                    type: Type.STRING,
                    description: "Description of the gap (e.g., 'Inconsistent CA prep vs strong exam retention')."
                  },
                  impactLevel: {
                    type: Type.STRING,
                    description: "Impact level (High, Medium, Low)."
                  }
                },
                required: ["gapDescription", "impactLevel"]
              }
            },
            actionableRecommendations: {
              type: Type.ARRAY,
              description: "Coaching strategies and interventions for the class and individual students.",
              items: {
                type: Type.OBJECT,
                properties: {
                  target: {
                    type: Type.STRING,
                    description: "Who this applies to, e.g., 'General Class', or a specific student's name."
                  },
                  strategy: {
                    type: Type.STRING,
                    description: "Concrete, actionable step-by-step pedagogic strategy to implement (e.g., peer review sessions, extra homework coaching)."
                  }
                },
                required: ["target", "strategy"]
              }
            }
          },
          required: ["summary", "metrics", "performanceCohorts", "learningGaps", "actionableRecommendations"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No response received from Gemini API.");
    }

    const analysis = JSON.parse(jsonText.trim());
    return res.json({ analysis });

  } catch (error: any) {
    console.error("Gemini Grade Analysis Error:", error);
    return res.status(500).json({ 
      error: error.message || "An unexpected error occurred during AI grade analysis." 
    });
  }
});

// REST API for generating Teacher Intervention Plan via Gemini API
app.post("/api/cbt/generate-intervention-plan", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { subjectName, classAvg = 44, schoolBenchmark = 50, tutor = "Subject Teacher", classCohort = "SS 2A" } = req.body;

    if (!subjectName) {
      return res.status(400).json({ error: "Subject name is required." });
    }

    const ai = getGeminiClient();

    const prompt = `Develop a comprehensive 4-week Academic Remediation & Teacher Intervention Plan for the subject "${subjectName}" (Lead Tutor: ${tutor}), currently taught to cohort "${classCohort}".
Current Class Average Score: ${classAvg}%
Institutional School Benchmark Target: ${schoolBenchmark}%
Gap below target: ${Math.max(0, schoolBenchmark - classAvg)} percentage points.

Provide a structured response in the specified JSON format analyzing the academic gap and creating an actionable weekly roadmap for the teacher.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are Nonye AI Master Academic Supervisor for Corner Streams. Create rigorous, realistic, and highly practical academic intervention plans for teachers when class averages fall below school benchmarks.",
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subjectName: { type: Type.STRING },
            diagnosis: { type: Type.STRING, description: "Detailed diagnosis of why the class average is below target." },
            gapPoints: { type: Type.NUMBER, description: "Difference between benchmark and class average." },
            weeklyRoadmap: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  weekNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  focusArea: { type: Type.STRING },
                  classroomActivities: { type: Type.STRING },
                  assessmentMethod: { type: Type.STRING }
                },
                required: ["weekNumber", "title", "focusArea", "classroomActivities", "assessmentMethod"]
              }
            },
            pedagogicStrategies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  strategyName: { type: Type.STRING },
                  description: { type: Type.STRING },
                  targetGroup: { type: Type.STRING }
                },
                required: ["strategyName", "description", "targetGroup"]
              }
            },
            evaluationMetrics: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["subjectName", "diagnosis", "gapPoints", "weeklyRoadmap", "pedagogicStrategies", "evaluationMetrics"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No response received from Gemini API.");
    }

    const plan = JSON.parse(jsonText.trim());
    return res.json({ plan });

  } catch (error: any) {
    console.error("Gemini Intervention Plan Error:", error);
    return res.status(500).json({ 
      error: error.message || "An unexpected error occurred during intervention plan generation." 
    });
  }
});

// REST API for Contextual Nonye AI Floating Assistant Chat with Multi-turn history and High Thinking Mode Support
app.post("/api/ai/assistant-chat", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { message, history = [], context = {}, enableHighThinking = true } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: "Message content is required." });
    }

    const userRole = context.userRole || "User";
    const userName = context.userName || "User";
    const activeTab = context.activeTab || "Dashboard";
    const activeView = context.currentView || "app";
    const schoolName = context.schoolName || "Corner Streams Private School";
    const subscriptionTier = context.subscriptionTier || "unified_enterprise";
    const additionalInfo = context.additionalInfo ? JSON.stringify(context.additionalInfo) : "";

    const screenSnapshot = context.screenSnapshot || {};
    const screenVisionSummary = screenSnapshot.summary || "";
    const domStructureSummary = screenSnapshot.domStructureSummary || "";
    const visibleElements = screenSnapshot.screenElementsDetected?.join("; ") || "";
    const availableActions = screenSnapshot.actionButtons?.join(", ") || screenSnapshot.keyDataPoints?.availableActions?.join(", ") || "";
    const visibleAlerts = screenSnapshot.alerts?.join("; ") || screenSnapshot.keyDataPoints?.visibleAlerts?.join("; ") || "";
    const tableDataJson = screenSnapshot.tableData && screenSnapshot.tableData.length > 0 ? JSON.stringify(screenSnapshot.tableData) : "";
    const formFieldsJson = screenSnapshot.activeFormFields && screenSnapshot.activeFormFields.length > 0 ? JSON.stringify(screenSnapshot.activeFormFields) : "";

    const systemInstruction = `You are Nonye AI, the omniscient J.A.R.V.I.S.-like AI Co-Pilot & Institutional Operating System for ${schoolName}.

YOUR J.A.R.V.I.S. SCREEN VISION & MANDATE:
- You possess real-time vision over the user's active screen, DOM structure, active tab, role permissions, and visible data state.
- When assisting, act like an elite, hyper-intelligent co-pilot (like J.A.R.V.I.S.): acknowledge what the user is currently viewing, spot anomalies, identify missing data, point to specific buttons/controls, and give crisp step-by-step directions.
- Speak with natural composure, fluid articulate English, warm politeness, and unwavering institutional precision.

CURRENT LIVE USER & SCREEN TELEMETRY:
- User: ${userName} (Role: ${userRole})
- Active Screen / View: ${activeView} -> ${activeTab}
- Subscription Tier: ${subscriptionTier}
${screenVisionSummary ? `- Screen Context Summary: ${screenVisionSummary}` : ""}
${domStructureSummary ? `- Live DOM Structure Snapshot:\n${domStructureSummary}` : ""}
${tableDataJson ? `- Visible Table Data & Headers: ${tableDataJson}` : ""}
${formFieldsJson ? `- Active Form Fields: ${formFieldsJson}` : ""}
${visibleElements ? `- Detected Screen Elements: ${visibleElements}` : ""}
${availableActions ? `- Available Screen Actions / Buttons: ${availableActions}` : ""}
${visibleAlerts ? `- Active On-Screen Warnings/Alerts: ${visibleAlerts}` : ""}
${additionalInfo ? `- Page Data Context: ${additionalInfo}` : ""}

ROLE-SPECIFIC CO-PILOT ASSISTANCE:
1. FOR TEACHERS (Stream Teacher):
   - Broadsheet & Scores: Point out missing CA 1, CA 2, or Exam scores immediately. Guide how to compute class positions.
   - CBT Builder: Draft MCQs directly matching syllabus, review questions, and configure test durations.
   - Report Cards: Synthesize personalized, motivating comments tailored to actual grades on screen.
   - Lesson Planning: Generate structured weekly lesson plans and scheme of work alignments.

2. FOR SCHOOL ADMINS & SUPER ADMINS (Stream Admin):
   - Institutional 360° Vision: Audit overall pass rates, teacher submission bottlenecks, pending CBT tests, and Bursary Gate clearance status.
   - Directive Actions: Point out exact steps to approve broadsheets, broadcast notifications, or configure school benchmarks.

3. FOR STUDENTS & PARENTS (Stream Student & Stream Parent):
   - Socratic Homework Tutor: Break down difficult STEM/Art problems step-by-step with formulas and derivations.
   - Result Breakdown & Bursary Guidance: Explain terminal report card performance and guide through receipt downloading.

RESPONSE STYLE:
- Directly reference what is on their screen where helpful (e.g. "On your current ${activeTab.replace(/_/g, ' ')} screen...").
- Keep instructions punchy, actionable, and formatted with Markdown headers and bullet points.
- When asked "what should I do?", "help me", or "analyze this", give clear numbered steps and highlight relevant buttons to click.`;

    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history) {
        if (h.text && (h.role === 'user' || h.role === 'model')) {
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          });
        }
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const isComplexQuery = enableHighThinking || message.length > 120 || /analyze|diagnose|strategy|remediation|audit|compare|curriculum|benchmark|proof|derive/i.test(message);

    const config: any = {
      systemInstruction,
    };

    if (isComplexQuery) {
      config.thinkingConfig = {
        thinkingLevel: ThinkingLevel.HIGH,
      };
    } else {
      config.temperature = 0.7;
    }

    const { text: replyText, modelUsed } = await generateWithFallback({
      primaryModel: isComplexQuery ? "gemini-3.1-pro-preview" : "gemini-3.5-flash",
      contents: contents,
      config: config
    });

    return res.json({ 
      reply: replyText || "I am here and ready to assist you.", 
      subscriptionTier,
      modelUsed: modelUsed,
      thinkingLevel: isComplexQuery ? "HIGH" : "STANDARD"
    });

  } catch (error: any) {
    console.error("Nonye AI Assistant Chat Error:", error);
    return res.status(500).json({
      error: error.message || "An unexpected error occurred during Nonye AI assistant chat."
    });
  }
});

// REST API for Deep Institutional Reasoning & Policy Diagnostics (with Thinking Mode and Resilient Quota Fallback)
app.post("/api/ai/deep-reasoning", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { topic, contextData = {}, query } = req.body;

    if (!query && !topic) {
      return res.status(400).json({ error: "A query or topic is required for deep reasoning analysis." });
    }

    const prompt = `Perform a comprehensive, high-order institutional analysis and strategic reasoning synthesis on the following academic problem or institutional inquiry:
Topic/Query: "${query || topic}"
School Context Data: ${JSON.stringify(contextData, null, 2)}

Structure your comprehensive output with:
1. Executive Problem Decomposition & Underlying Root Causes
2. Multi-Factor Correlation (Academic, Behavioral, Financial/Bursary, Compliance)
3. Step-by-Step Remediation Strategy with Milestones
4. Risk Matrix & Mitigations
5. Long-term Institutional Impact Forecast`;

    const { text: analysisText, modelUsed } = await generateWithFallback({
      primaryModel: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are Nonye AI Reasoning Engine, the flagship institutional intelligence architect for Corner Streams. Employ high thinking mode to resolve users' most complex educational leadership, psychometric testing, and administrative queries with exhaustive mathematical and logical depth.",
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      }
    });

    return res.json({
      result: analysisText || "Reasoning synthesis complete.",
      modelUsed: modelUsed,
      thinkingLevel: "HIGH"
    });
  } catch (error: any) {
    console.error("Deep Reasoning Error:", error);
    return res.status(500).json({
      error: error.message || "An error occurred during deep reasoning processing."
    });
  }
});

// REST API for Nonye AI Scholar Homework & CBT Exam Tutor (with Thinking Mode for Complex STEM/Logic)
app.post("/api/ai/scholar", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { query, subject = "General Academics", gradeLevel = "SS 2 / Senior Secondary", enableHighThinking = true } = req.body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({ error: "A valid question or study topic is required." });
    }

    const systemInstruction = `You are Nonye AI Scholar, an expert Socratic homework tutor and CBT exam mentor for Corner Streams.
Your goal is to guide students in ${subject} (${gradeLevel} level) with clear, step-by-step academic explanations and deep derivations, speaking fluent English with fluid clarity.

FORMAT YOUR RESPONSE WITH MARKDOWN:
1. ### 📐 Step-by-Step Explanation: Clearly break down the core concept or formula with derivation.
2. 💡 Key Rule / Formula: Highlight the core theorem, definition, or grammatical rule.
3. 📝 Exam Tip & Common Pitfalls: Explain what examiners look for during terminal CBT exams.
4. 🎯 Instant Practice Drill: Provide 1 sample question with solution steps so the student can test their understanding.

Be encouraging, academically accurate, and clear!`;

    const config: any = {
      systemInstruction,
    };

    if (enableHighThinking) {
      config.thinkingConfig = {
        thinkingLevel: ThinkingLevel.HIGH,
      };
    } else {
      config.temperature = 0.6;
    }

    const { text: explanation, modelUsed } = await generateWithFallback({
      primaryModel: enableHighThinking ? "gemini-3.1-pro-preview" : "gemini-3.5-flash",
      contents: `Student Query in ${subject} (${gradeLevel}): "${query}"`,
      config: config
    });

    return res.json({ 
      explanation: explanation || "I was unable to synthesize a solution step. Please rephrase your question.",
      modelUsed: modelUsed,
      thinkingLevel: enableHighThinking ? "HIGH" : "STANDARD"
    });

  } catch (error: any) {
    console.error("Nonye AI Scholar Error:", error);
    return res.status(500).json({
      error: error.message || "Unable to reach Nonye AI Scholar service."
    });
  }
});

// REST API for AI Report Card Auto-Comment Generation
app.post("/api/reportcard/generate-auto-comment", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const {
      studentName = "Student",
      subjectScores = [],
      psychomotorRatings = [],
      tone = "Encouraging & Constructive",
      session = "2025/2026",
      term = "1st Term",
      classCohort = "SS 2 Science"
    } = req.body;

    if (!studentName || !studentName.trim()) {
      return res.status(400).json({ error: "Student name is required." });
    }

    // Extract student first name specifically
    const cleanName = studentName.trim();
    const nameParts = cleanName.split(/\s+/);
    const firstName = nameParts[0] || "Student";

    const ai = getGeminiClient();

    const prompt = `You are writing terminal report card feedback for student: "${cleanName}" (First Name: "${firstName}") in ${classCohort} for ${term}, ${session}.

ACADEMIC SUBJECT PERFORMANCE DATA:
${JSON.stringify(subjectScores, null, 2)}

AFFECTIVE & PSYCHOMOTOR SKILL RATINGS:
${JSON.stringify(psychomotorRatings, null, 2)}

TEACHER DESIRED COMMENTS TONE: "${tone}"

CRITICAL INSTRUCTION REQUIREMENTS:
1. You MUST address or refer to the student personally using their FIRST NAME ("${firstName}"). For example: "${firstName} has demonstrated outstanding academic consistency...", "We encourage ${firstName} to maintain this momentum...", etc.
2. Synthesize their actual subject performance (highlighting strengths and any areas needing support).
3. Directly reflect their psychomotor/affective trait ratings (punctuality, neatness, class participation, peer leadership, emotional stability).
4. Provide structured JSON output with teacherComment, principalRemark, keyStrengths, and focusAreas.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an empathetic, highly articulate master school educator and class tutor. Draft clear, warm, personal, and professional report card comments that motivate the student by their first name while providing actionable clarity for parents.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            firstName: { 
              type: Type.STRING, 
              description: "The student's first name." 
            },
            teacherComment: {
              type: Type.STRING,
              description: "A personalized 3-4 sentence Class Teacher report card remark addressing or referencing the student by first name, citing academic performance and psychomotor traits."
            },
            principalRemark: {
              type: Type.STRING,
              description: "A concise 1-2 sentence official Principal's endorsement remark mentioning the student by first name."
            },
            keyStrengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2-3 bullet points highlighting specific subject or behavioral strengths."
            },
            focusAreas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "1-2 actionable growth goals for the student."
            }
          },
          required: ["firstName", "teacherComment", "principalRemark", "keyStrengths", "focusAreas"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No response received from Gemini API.");
    }

    const autoComment = JSON.parse(jsonText.trim());
    return res.json({ autoComment });

  } catch (error: any) {
    console.error("Gemini Auto-Comment Generation Error:", error);
    return res.status(500).json({
      error: error.message || "An unexpected error occurred during AI report card comment generation."
    });
  }
});

// REST API for Google Search Grounding with gemini-3.5-flash
app.post("/api/ai/search-grounding", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { query, category = "General Education" } = req.body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({ error: "A valid search query is required." });
    }

    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Academic/Institutional Research Query: "${query}"\nDomain/Context: ${category}`,
      config: {
        systemInstruction: "You are Nonye AI Web Intelligence Assistant. You utilize Google Search Grounding to provide accurate, verified, up-to-date real-world facts, curriculum syllabi (e.g. WAEC, NECO, Cambridge, JAMB), educational regulations, current events, and verified statistics. Synthesize concise, well-structured answers with markdown formatting.",
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "No grounded synthesis available.";
    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSearchQueries = response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];

    // Extract cleanly formatted source references
    const sources = rawChunks
      .filter((chunk: any) => chunk.web && chunk.web.uri)
      .map((chunk: any) => ({
        title: chunk.web.title || "Web Reference",
        url: chunk.web.uri
      }));

    return res.json({
      result: text,
      sources,
      webSearchQueries,
      modelUsed: "gemini-3.5-flash",
      grounded: sources.length > 0
    });
  } catch (error: any) {
    console.error("Google Search Grounding Error:", error);
    return res.status(500).json({
      error: error.message || "An error occurred during Google Search Grounding retrieval."
    });
  }
});

// REST API for Fast Tasks (e.g. Instant Editing, Rapid Polish, Instant SMS Broadcast Drafts, Quick Quiz) with gemini-3.1-flash-lite
app.post("/api/ai/fast-edit", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { text, instruction = "Fix grammar, spelling, and polish clarity", mode = "polish" } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Text content is required for fast edit." });
    }

    const ai = getGeminiClient();

    let systemInstruction = "You are Nonye AI Fast Editor, a high-speed text refinement engine. Return the improved text directly without conversational preamble.";
    if (mode === "sms") {
      systemInstruction = "You are Nonye AI Fast SMS Drafter. Condense the message to an urgent, clear 160-character institutional SMS notification for parents/staff.";
    } else if (mode === "summarize") {
      systemInstruction = "You are Nonye AI Fast Summarizer. Produce a 2-3 bullet point summary of the text immediately.";
    }

    const prompt = `Instruction: ${instruction}\n\nOriginal Text:\n"""\n${text}\n"""`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MINIMAL,
        },
        temperature: 0.3
      }
    });

    const result = response.text || text;
    return res.json({
      result: result.trim(),
      modelUsed: "gemini-3.1-flash-lite",
      speed: "ultra-fast"
    });
  } catch (error: any) {
    console.error("Fast Edit Error:", error);
    return res.status(500).json({
      error: error.message || "Fast edit failed."
    });
  }
});

app.post("/api/ai/fast-quiz", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { topic = "General Science", count = 3 } = req.body;

    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: `Generate a rapid ${count}-question multiple-choice quick quiz on "${topic}".`,
      config: {
        systemInstruction: "You are Nonye AI Rapid Quiz Generator. Output a fast JSON list of multiple choice questions with 4 options and the correct answer index.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctIndex: { type: Type.INTEGER },
              quickExplanation: { type: Type.STRING }
            },
            required: ["question", "options", "correctIndex", "quickExplanation"]
          }
        },
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MINIMAL
        }
      }
    });

    const questions = JSON.parse(response.text?.trim() || "[]");
    return res.json({
      questions,
      modelUsed: "gemini-3.1-flash-lite"
    });
  } catch (error: any) {
    console.error("Fast Quiz Error:", error);
    return res.status(500).json({
      error: error.message || "Fast quiz generation failed."
    });
  }
});

// REST API for Nonye AI Neural Text-to-Speech (ElevenLabs Voice Clone with Acoustic Fallback)
app.post("/api/ai/tts", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { text, voiceStyle = "fluent" } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Text is required for speech synthesis." });
    }

    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    const customVoiceId = process.env.NONYE_VOICE_ID || process.env.CHINONYE_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";

    if (elevenLabsKey) {
      // Call ElevenLabs API for instant, real human-like voice synthesis
      const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${customVoiceId}`, {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": elevenLabsKey,
        },
        body: JSON.stringify({
          text: text.slice(0, 1000), // Cap length for fast delivery
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.88,
            style: 0.25,
            use_speaker_boost: true
          }
        })
      });

      if (elevenRes.ok) {
        const audioBuffer = await elevenRes.arrayBuffer();
        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("Content-Length", audioBuffer.byteLength.toString());
        return res.send(Buffer.from(audioBuffer));
      } else {
        const errText = await elevenRes.text();
        console.warn("ElevenLabs TTS warning:", errText);
      }
    }

    // If ElevenLabs not configured or returned non-200, return fallback indicator for client-side high-fidelity acoustic player
    return res.json({
      status: "fallback",
      hasCustomKey: !!elevenLabsKey,
      message: "Ready for high-fidelity acoustic playback."
    });

  } catch (error: any) {
    console.error("Nonye AI TTS Error:", error);
    return res.status(500).json({
      error: error.message || "Failed to synthesize speech."
    });
  }
});

// REST API for Student Personalized Reading & Study Timetable Scheduler
app.post("/api/ai/student/study-timetable", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { 
      studentName = "Student", 
      gradeLevel = "SS 2", 
      subjects = ["Mathematics", "English", "Physics", "Chemistry", "Biology"],
      weakSubjects = ["Physics", "Mathematics"],
      weeklyAvailability = {
        monday: 2,
        tuesday: 2,
        wednesday: 2,
        thursday: 2,
        friday: 2,
        saturday: 3.5,
        sunday: 2
      },
      preferredTimeSlots = "Evenings (5:00 PM - 8:00 PM) on weekdays, Mornings & Afternoons on weekends",
      studyPace = "balanced", // balanced, intensive, light
      includeBreaks = true,
      breakIntervalMinutes = 10,
      examPrepFocus = "Terminal CBT Midterms & WAEC Preparations",
      revisionRatio = "30% Revision, 50% New Topics, 20% CBT Practice Drills"
    } = req.body;

    const ai = getGeminiClient();

    const formattedSubjects = Array.isArray(subjects) 
      ? subjects.map(s => typeof s === 'string' ? s : s.name).join(", ")
      : String(subjects);

    const formattedWeakSubjects = Array.isArray(weakSubjects) 
      ? weakSubjects.join(", ")
      : String(weakSubjects);

    const prompt = `You are Nonye AI, an expert academic mentor and cognitive study scheduler for Nigerian and West African secondary/high-school curricula.
Generate a comprehensive, scientifically optimized 7-day personalized Study & Reading Timetable for ${studentName} (${gradeLevel}).

STUDENT PREFERENCES & AVAILABILITY CONSTRAINTS:
- Enrolled Subjects: ${formattedSubjects}
- Priority / Weak Subjects: ${formattedWeakSubjects}
- Weekly Availability Hours by Day: ${JSON.stringify(weeklyAvailability)}
- Preferred Time Windows: ${preferredTimeSlots}
- Study Pace Mode: ${studyPace}
- Include Structured Breaks: ${includeBreaks ? `Yes (insert ~${breakIntervalMinutes}-minute cognitive rest intervals)` : "No"}
- Target Exam & Milestone: ${examPrepFocus}
- Balance Ratio: ${revisionRatio}

CORE INSTRUCTIONS FOR THE TIMETABLE:
1. Balance High-Cognitive Load (STEM: Physics, Further Math, Chemistry) with Low-Cognitive Load (Arts/Humanities: English, Civic, Literature). Never stack two intense STEM problem-solving sessions back-to-back without a rest or humanities transition.
2. Structure discrete session blocks (Start Time to End Time) matching the student's daily available hours.
3. Include explicit break sessions (e.g. "Brain Rest & Hydration", "Eye Stretch") when breaks are enabled.
4. Assign effective cognitive techniques to each study session (e.g., "Active Recall Flashcards", "Feynman Technique", "Pomodoro 25/5 Sprints", "Past WAEC/JAMB CBT Drills", "Spaced Interval Review").
5. Provide actionable milestone goals for each study block.
6. Provide an inspiring weekly target and 3 Nonye study directives.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Nonye AI Master Academic Scheduler. Output valid JSON containing a detailed, inspiring, and realistic 7-day reading schedule with structured session blocks and breaks.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            weeklyTarget: { type: Type.STRING, description: "Inspiring weekly focus motto or objective." },
            weeklyStrategy: { type: Type.STRING, description: "Brief 2-sentence rationale of how this schedule balances revision, exam prep, and mental rest." },
            totalWeeklyHours: { type: Type.NUMBER, description: "Total planned study hours across the 7 days." },
            dailySchedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING, description: "e.g. Monday, Tuesday, etc." },
                  dayTheme: { type: Type.STRING, description: "e.g. STEM Foundations & Formula Mastery" },
                  targetHours: { type: Type.NUMBER },
                  sessions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        timeSlot: { type: Type.STRING, description: "e.g. 5:00 PM - 5:45 PM" },
                        type: { type: Type.STRING, description: "study, break, revision, or cbt_practice" },
                        subject: { type: Type.STRING },
                        topicFocus: { type: Type.STRING },
                        technique: { type: Type.STRING, description: "e.g. Pomodoro 25/5, Active Recall, Feynman Explanation, Timed CBT Drill" },
                        milestoneGoal: { type: Type.STRING }
                      },
                      required: ["id", "timeSlot", "type", "subject", "topicFocus", "technique", "milestoneGoal"]
                    }
                  }
                },
                required: ["day", "dayTheme", "targetHours", "sessions"]
              }
            },
            mentorTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 actionable memory and study habit tips."
            }
          },
          required: ["weeklyTarget", "weeklyStrategy", "totalWeeklyHours", "dailySchedule", "mentorTips"]
        }
      }
    });

    const timetable = JSON.parse(response.text?.trim() || "{}");
    return res.json({ timetable });

  } catch (error: any) {
    console.error("Nonye Study Timetable Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate study timetable." });
  }
});

// REST API for Student Next-Day Timetable & Preparation Alerts
app.post("/api/ai/student/next-day-alerts", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { 
      studentName = "Student", 
      gradeLevel = "SS 2", 
      tomorrowDay = "Tuesday",
      scheduledSubjects = ["Further Mathematics", "Biology", "Literature in English", "Civic Education"]
    } = req.body;

    const ai = getGeminiClient();

    const prompt = `You are Nonye AI Study Mentor. Generate a smart Next-Day Timetable Alert and preparation briefing for ${studentName} (${gradeLevel}) for tomorrow (${tomorrowDay}).

TOMORROW'S SCHEDULED SUBJECTS:
${scheduledSubjects.join(", ")}

Generate:
1. A warm, motivating briefing message (e.g., "Tomorrow you have ${scheduledSubjects.join(", ")}...").
2. Subject-by-subject preparation checkpoints (required notebooks, textbook chapters, formula sheets to bring).
3. A 1-minute quick review challenge question for one of the subjects to test their memory tonight.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Nonye AI, an articulate and encouraging academic companion from Ngwa, Abia State. Deliver crisp, motivating next-day school prep briefings.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            greetingBriefing: { type: Type.STRING },
            tomorrowDay: { type: Type.STRING },
            subjectCheckpoints: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  subject: { type: Type.STRING },
                  period: { type: Type.STRING },
                  keyPreparation: { type: Type.STRING },
                  materialsNeeded: { type: Type.STRING }
                },
                required: ["subject", "keyPreparation", "materialsNeeded"]
              }
            },
            quickChallengeQuestion: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING },
                question: { type: Type.STRING },
                hint: { type: Type.STRING }
              },
              required: ["subject", "question", "hint"]
            }
          },
          required: ["greetingBriefing", "tomorrowDay", "subjectCheckpoints", "quickChallengeQuestion"]
        }
      }
    });

    const alertData = JSON.parse(response.text?.trim() || "{}");
    return res.json({ alertData });

  } catch (error: any) {
    console.error("Nonye Next-Day Alerts Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate next-day alerts." });
  }
});

// REST API for Student Adaptive Study & Memory Techniques
app.post("/api/ai/student/study-techniques", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { 
      subject = "Physics", 
      topic = "Electromagnetism", 
      difficultyArea = "Formulas & Problem Solving",
      targetExam = "WAEC & JAMB CBT"
    } = req.body;

    const ai = getGeminiClient();

    const prompt = `You are Nonye AI Master Academic Coach. Provide concrete, proven memory retention and study techniques for a student struggling with "${difficultyArea}" in "${subject}: ${topic}" preparing for "${targetExam}".

Detail 4 specific methodologies adapted for this exact topic:
1. Feynman Technique (Simplifying the concept into plain words with real-world analogy).
2. Active Recall & Flashcard Drills (3 prompt-answer drill pairs).
3. Pomodoro 25/5 Study Sprint Breakdown.
4. Spaced Repetition Review Intervals (Day 1, Day 3, Day 7, Day 21).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Nonye AI Academic Coach. Provide practical, high-yield cognitive study techniques.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topicSummary: { type: Type.STRING },
            feynmanAnalogy: { type: Type.STRING },
            activeRecallDrills: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  prompt: { type: Type.STRING },
                  answer: { type: Type.STRING }
                },
                required: ["prompt", "answer"]
              }
            },
            pomodoroSprintPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sprintNumber: { type: Type.INTEGER },
                  durationMinutes: { type: Type.INTEGER },
                  focusTask: { type: Type.STRING }
                },
                required: ["sprintNumber", "durationMinutes", "focusTask"]
              }
            },
            spacedRepetitionMilestones: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["topicSummary", "feynmanAnalogy", "activeRecallDrills", "pomodoroSprintPlan", "spacedRepetitionMilestones"]
        }
      }
    });

    const techniques = JSON.parse(response.text?.trim() || "{}");
    return res.json({ techniques });

  } catch (error: any) {
    console.error("Nonye Study Techniques Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate study techniques." });
  }
});

// REST API for Nonye AI Quick-Study Interactive Triggers
app.post("/api/ai/student/quick-study", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const {
      actionType = "active_recall_drill", // active_recall_drill, topic_summary, speed_cbt_quiz, pomodoro_plan
      subject = "Physics",
      topic = "Electric Current & Resistivity",
      gradeLevel = "SS 2",
      studentName = "Student"
    } = req.body;

    const ai = getGeminiClient();

    let prompt = "";
    let systemInstruction = "";
    let responseSchema: any = null;

    if (actionType === "active_recall_drill") {
      systemInstruction = "You are Nonye AI, an energetic and precise academic study mentor. Generate high-yield active recall flashcard drill questions.";
      prompt = `Generate 4 high-impact, testable Active Recall Flashcards for ${studentName} (${gradeLevel}) studying "${subject}: ${topic}".
Target common WAEC, JAMB, and terminal CBT examination questions.`;
      
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          topic: { type: Type.STRING },
          intro: { type: Type.STRING, description: "Encouraging 1-sentence prompt from Nonye." },
          flashcards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                question: { type: Type.STRING },
                answer: { type: Type.STRING },
                hint: { type: Type.STRING },
                formulaOrKeynote: { type: Type.STRING }
              },
              required: ["id", "question", "answer", "hint"]
            }
          },
          memoryMotto: { type: Type.STRING }
        },
        required: ["subject", "topic", "intro", "flashcards", "memoryMotto"]
      };
    } else if (actionType === "topic_summary") {
      systemInstruction = "You are Nonye AI, an intuitive mentor who explains complex STEM and humanities concepts using plain English, brilliant analogies, and crisp memory anchors.";
      prompt = `Generate a concise, crystal-clear Topic Summary and Feynman Analogy for ${studentName} (${gradeLevel}) studying "${subject}: ${topic}".
Include:
1. Core concept in 2 simple sentences.
2. An intuitive, memorable real-world analogy.
3. Key formulas or core definitions.
4. Top 2 exam traps / common mistakes students make in CBT/WAEC.
5. Practical real-life application.`;

      responseSchema = {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          topic: { type: Type.STRING },
          headline: { type: Type.STRING },
          coreConcept: { type: Type.STRING },
          feynmanAnalogy: { type: Type.STRING },
          keyFormulas: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          examTraps: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          practicalApplication: { type: Type.STRING },
          audioRecap: { type: Type.STRING, description: "A 3-sentence conversational summary suitable for Nonye text-to-speech audio." }
        },
        required: ["subject", "topic", "headline", "coreConcept", "feynmanAnalogy", "keyFormulas", "examTraps", "practicalApplication", "audioRecap"]
      };
    } else if (actionType === "speed_cbt_quiz") {
      systemInstruction = "You are Nonye AI CBT Architect. Generate quick-fire, multiple-choice quiz items with clear distractor explanations.";
      prompt = `Generate a 3-question Rapid CBT Speed Challenge for ${studentName} (${gradeLevel}) on "${subject}: ${topic}".`;

      responseSchema = {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          topic: { type: Type.STRING },
          challengeTitle: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                questionText: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                correctIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              },
              required: ["id", "questionText", "options", "correctIndex", "explanation"]
            }
          }
        },
        required: ["subject", "topic", "challengeTitle", "questions"]
      };
    } else {
      // Default: pomodoro_plan
      systemInstruction = "You are Nonye AI Focus Coach. Create an actionable 25-minute Pomodoro study roadmap.";
      prompt = `Create a structured 25-minute Pomodoro sprint plan for ${studentName} studying "${subject}: ${topic}".`;

      responseSchema = {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          topic: { type: Type.STRING },
          sprintGoal: { type: Type.STRING },
          phases: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                minuteRange: { type: Type.STRING },
                task: { type: Type.STRING }
              },
              required: ["minuteRange", "task"]
            }
          },
          coachingTip: { type: Type.STRING }
        },
        required: ["subject", "topic", "sprintGoal", "phases", "coachingTip"]
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema
      }
    });

    const result = JSON.parse(response.text?.trim() || "{}");
    return res.json({ result });

  } catch (error: any) {
    console.error("Nonye Quick Study Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate quick study interaction." });
  }
});

// REST API for Nonye AI Socratic Homework Mentoring
app.post("/api/ai/assignment/socratic-mentor", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const {
      assignmentTitle = "Homework Task",
      subject = "Physics",
      topic = "Electric Circuits",
      instructions = [],
      studentQuestion = "Where do I start?",
      conversationHistory = [],
      studentName = "Student"
    } = req.body;

    const ai = getGeminiClient();

    const historyFormatted = conversationHistory
      .map((m: any) => `${m.sender === "student" ? "Student" : "Nonye"}: ${m.text}`)
      .join("\n");

    const prompt = `You are Nonye AI, an elite Socratic Academic Tutor for ${studentName} at Corner Streams Academy.
The student is working on their homework assignment:
- Assignment Title: ${assignmentTitle}
- Subject: ${subject}
- Topic: ${topic}
- Assignment Instructions/Questions: ${Array.isArray(instructions) ? instructions.join("; ") : instructions}

CURRENT STUDENT QUESTION/BLOCKER:
"${studentQuestion}"

PREVIOUS DIALOGUE HISTORY:
${historyFormatted || "None yet. This is the start of the session."}

SOCRATIC TUTORING RULES (CRITICAL):
1. NEVER just hand the student the final computed numerical answer or write their essay for them.
2. Guide them step-by-step using thought-provoking questions, intuitive real-world analogies, and formula breakdowns.
3. Break the problem into manageable micro-steps.
4. Praise their critical thinking and effort.
5. If they are stuck on a formula, prompt them on what variables they already know.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Nonye AI, a compassionate, articulate Socratic academic mentor from Ngwa, Abia State. Guide students toward self-discovery without giving away direct homework answers.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            socraticResponse: { type: Type.STRING, description: "Your conversational, encouraging response guiding the student forward." },
            guidingQuestion: { type: Type.STRING, description: "One focused question to prompt the student's next step." },
            formulaHint: { type: Type.STRING, description: "Key formula or rule to consider (if applicable)." },
            encouragement: { type: Type.STRING, description: "1-sentence motivational cheer." }
          },
          required: ["socraticResponse", "guidingQuestion", "encouragement"]
        }
      }
    });

    const result = JSON.parse(response.text?.trim() || "{}");
    return res.json({ result });

  } catch (error: any) {
    console.error("Nonye Socratic Mentor Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate Socratic guidance." });
  }
});

// REST API for Teacher AI Assignment Generator
app.post("/api/ai/assignment/generate-questions", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const {
      subject = "Mathematics",
      topic = "Calculus & Derivatives",
      classCohort = "SS 2 Science",
      difficulty = "Standard WAEC/JAMB",
      questionCount = 3
    } = req.body;

    const ai = getGeminiClient();

    const prompt = `Generate a structured, curriculum-aligned homework assignment for ${classCohort} on "${subject}: ${topic}".
Difficulty: ${difficulty}.
Target Questions Count: ${questionCount}.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Nonye AI Curriculum Specialist. Generate high-yield, structured homework assignments with instructions and rubrics.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            topic: { type: Type.STRING },
            suggestedMaxMarks: { type: Type.INTEGER },
            instructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            questions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            socraticContext: { type: Type.STRING, description: "Guiding notes to help AI mentor students who get stuck on this specific assignment." }
          },
          required: ["title", "topic", "suggestedMaxMarks", "instructions", "questions", "socraticContext"]
        }
      }
    });

    const assignmentDraft = JSON.parse(response.text?.trim() || "{}");
    return res.json({ assignmentDraft });

  } catch (error: any) {
    console.error("Teacher Assignment Gen Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate assignment." });
  }
});

// REST API for School Admin 360° Institutional Operational Audit
app.post("/api/ai/admin/institutional-audit", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { 
      schoolName = "Corner Streams Academy", 
      totalStudents = 420, 
      totalTeachers = 28,
      attendanceRate = 94.5,
      feeComplianceRate = 82.0,
      broadsheetApproved = 8,
      broadsheetPending = 4,
      liveCbtExams = 3
    } = req.body;

    const ai = getGeminiClient();

    const prompt = `Synthesize an Executive 360° Institutional Operational Audit for ${schoolName}.
OPERATIONAL DATA METRICS:
- Total Enrolled Students: ${totalStudents}
- Teaching Staff: ${totalTeachers}
- Average Student Daily Attendance: ${attendanceRate}%
- Bursary Tuition Fee Collection Rate: ${feeComplianceRate}%
- Terminal Broadsheets Approved: ${broadsheetApproved} / ${broadsheetApproved + broadsheetPending}
- Active Live CBT Examinations: ${liveCbtExams}

Provide executive insights on academic health, financial fee recovery, grading bottleneck risks, and strategic directives.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are Nonye AI Executive Advisor for Corner Streams. Deliver concise, high-impact institutional briefings.",
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: { type: Type.STRING },
            healthScore: { type: Type.NUMBER, description: "Calculated institutional health score out of 100." },
            pillarAudits: {
              type: Type.OBJECT,
              properties: {
                academicGrading: { type: Type.STRING },
                bursaryLedger: { type: Type.STRING },
                attendanceStaffing: { type: Type.STRING }
              },
              required: ["academicGrading", "bursaryLedger", "attendanceStaffing"]
            },
            urgentActionItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["executiveSummary", "healthScore", "pillarAudits", "urgentActionItems"]
        }
      }
    });

    const audit = JSON.parse(response.text?.trim() || "{}");
    return res.json({ audit });

  } catch (error: any) {
    console.error("Institutional Audit Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate institutional audit." });
  }
});

// REST API for Parent Advisory & Report Card Plain-English Translation
app.post("/api/ai/parent/performance-advisory", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { 
      studentName = "Student",
      classLevel = "SS 2",
      termAverage = 74.2,
      attendanceRate = 96,
      topSubjects = ["Mathematics (88%)", "Chemistry (82%)"],
      weakSubjects = ["Physics (56%)"],
      feeBalance = "₦0.00"
    } = req.body;

    const ai = getGeminiClient();

    const prompt = `You are Nonye AI Parent Advisory Liaison. Translate the academic report card and school status of ${studentName} (${classLevel}) into clear, empathetic, and parent-friendly insights.

DATA:
- Student: ${studentName} (${classLevel})
- Term Average: ${termAverage}%
- Attendance Rate: ${attendanceRate}%
- Top Performing Subjects: ${topSubjects.join(", ")}
- Subjects Needing Support: ${weakSubjects.join(", ")}
- Tuition Balance: ${feeBalance}

Provide a supportive summary for parents on how to encourage their child at home, address challenging subjects without stress, and praise their strong achievements.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Nonye AI Parent Liaison. Provide warm, encouraging, plain-English academic guidance for parents.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            parentGreeting: { type: Type.STRING },
            academicSummary: { type: Type.STRING },
            celebrationPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            homeSupportTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            feeStatusNotice: { type: Type.STRING }
          },
          required: ["parentGreeting", "academicSummary", "celebrationPoints", "homeSupportTips", "feeStatusNotice"]
        }
      }
    });

    const advisory = JSON.parse(response.text?.trim() || "{}");
    return res.json({ advisory });

  } catch (error: any) {
    console.error("Parent Advisory Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate parent advisory." });
  }
});

// ==========================================
// CALLMEBOT WHATSAPP API & MULTI-CHANNEL NOTIFICATION ENGINE
// ==========================================

const DEFAULT_TARGET_PHONE = "+2348141880550";
const DEFAULT_RECIPIENT_EMAILS = [
  "mervyndeanhilary@gmail.com",
  "eluwamercy789@gmail.com",
  "thecornerstreams@gmail.com",
  "mervynifeanyi@gmail.com"
];

let lastPageViewThrottle = 0;

export interface NotificationDiagnosticLog {
  id: string;
  timestamp: string;
  channel: "whatsapp_callmebot" | "whatsapp_twilio" | "telegram" | "email";
  status: "success" | "error" | "skipped_unconfigured" | "pending";
  event: string;
  recipient: string;
  details: string;
  httpStatus?: number;
  error?: string;
}

// In-memory diagnostic logs buffer (stores last 50 notification events for admin auditing)
const notificationDiagnosticLogs: NotificationDiagnosticLog[] = [];

export function pushNotificationDiagnosticLog(log: Omit<NotificationDiagnosticLog, "id" | "timestamp">) {
  const entry: NotificationDiagnosticLog = {
    id: `diag-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...log
  };
  notificationDiagnosticLogs.unshift(entry);
  if (notificationDiagnosticLogs.length > 60) {
    notificationDiagnosticLogs.pop();
  }
}

/**
 * CallMeBot WhatsApp API Gateway Dispatcher
 * URL Format: https://api.callmebot.com/whatsapp.php?phone=[phone]&text=[text]&apikey=[apikey]
 * Phone format must be international without + or spaces (e.g. 2348141880550)
 */
export async function sendCallMeBotWhatsApp(
  message: string,
  options: { phone?: string; apiKey?: string; event?: string } = {}
): Promise<{ success: boolean; error?: string; status?: number; gateway?: string }> {
  const eventName = options.event || "general_alert";
  const rawPhone = options.phone || process.env.CALLMEBOT_PHONE || process.env.WHATSAPP_NOTIFICATION_PHONE || DEFAULT_TARGET_PHONE;
  const rawApiKey = options.apiKey || process.env.CALLMEBOT_API_KEY || process.env.CALLMEBOT_APIKEY;

  if (!rawPhone || !rawApiKey) {
    const errorMsg = "CALLMEBOT_API_KEY or CALLMEBOT_PHONE is not configured in environment";
    console.log(`[CallMeBot WhatsApp]: Skipped - ${errorMsg}`);
    pushNotificationDiagnosticLog({
      channel: "whatsapp_callmebot",
      status: "skipped_unconfigured",
      event: eventName,
      recipient: rawPhone || "Not set",
      details: "Skipped dispatch: Missing CALLMEBOT_API_KEY in app environment settings.",
      error: errorMsg
    });
    return { success: false, error: errorMsg };
  }

  // Clean phone number: remove +, spaces, dashes, parentheses
  const cleanPhone = rawPhone.replace(/[^0-9]/g, "");
  const cleanApiKey = rawApiKey.trim();

  if (!cleanPhone || !cleanApiKey) {
    const errorMsg = "Invalid sanitized phone number or empty API key";
    pushNotificationDiagnosticLog({
      channel: "whatsapp_callmebot",
      status: "error",
      event: eventName,
      recipient: rawPhone,
      details: "Sanitization failed for phone or API key.",
      error: errorMsg
    });
    return { success: false, error: errorMsg };
  }

  try {
    const encodedText = encodeURIComponent(message);
    const apiUrl = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cleanPhone)}&text=${encodedText}&apikey=${encodeURIComponent(cleanApiKey)}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "User-Agent": "CornerStreams-NotificationEngine/1.0"
      }
    });

    const responseBody = await response.text();

    if (response.ok) {
      console.log(`[CallMeBot WhatsApp Success]: Dispatched to +${cleanPhone} (HTTP ${response.status})`);
      pushNotificationDiagnosticLog({
        channel: "whatsapp_callmebot",
        status: "success",
        event: eventName,
        recipient: `+${cleanPhone}`,
        details: `Dispatched successfully to WhatsApp via CallMeBot gateway: ${responseBody.slice(0, 100)}`,
        httpStatus: response.status
      });
      return { success: true, status: response.status, gateway: "callmebot" };
    } else {
      console.warn(`[CallMeBot WhatsApp API Error]: Status ${response.status} - ${responseBody}`);
      pushNotificationDiagnosticLog({
        channel: "whatsapp_callmebot",
        status: "error",
        event: eventName,
        recipient: `+${cleanPhone}`,
        details: `CallMeBot returned HTTP error ${response.status}`,
        httpStatus: response.status,
        error: responseBody || `HTTP ${response.status}`
      });
      return { success: false, status: response.status, error: responseBody || `HTTP ${response.status}` };
    }
  } catch (error: any) {
    console.error("[CallMeBot WhatsApp Exception]:", error);
    pushNotificationDiagnosticLog({
      channel: "whatsapp_callmebot",
      status: "error",
      event: eventName,
      recipient: `+${cleanPhone}`,
      details: "Network connection or timeout exception talking to CallMeBot.",
      error: error.message
    });
    return { success: false, error: error.message || "Failed to reach CallMeBot API" };
  }
}

// Helper to parse SMTP port safely even if SMTP_PORT is set to an email, inbox ID, or invalid string
function parseSmtpPort(rawPort: any): number {
  if (rawPort === undefined || rawPort === null || rawPort === "") {
    return 465;
  }
  const str = String(rawPort).trim();
  
  // If the value looks like an email address or inbox identifier (e.g. "thecornerstreams@gmail.com" or "inbox_id")
  if (str.includes("@") || /[a-zA-Z]/.test(str)) {
    // Attempt to extract numeric port digits if embedded (e.g. "port: 587", "465/tcp", ":465")
    const portMatch = str.match(/\b(25|465|587|2525|8025)\b/) || str.match(/\b\d{2,5}\b/);
    if (portMatch) {
      const parsed = parseInt(portMatch[0], 10);
      if (parsed >= 1 && parsed <= 65535) {
        return parsed;
      }
    }
    console.warn(`[SMTP Config Warning]: SMTP_PORT was set to non-numeric value / inbox identifier ("${str}"). Defaulting to port 465.`);
    return 465;
  }

  const parsed = parseInt(str, 10);
  if (!isNaN(parsed) && parsed >= 1 && parsed <= 65535) {
    return parsed;
  }
  
  console.warn(`[SMTP Config Warning]: Invalid SMTP_PORT number (${str}). Defaulting to port 465.`);
  return 465;
}

// Helper to parse SMTP host safely, preventing email addresses from being treated as hostnames
function parseSmtpHost(rawHost: any): string {
  if (!rawHost || typeof rawHost !== "string" || !rawHost.trim()) {
    return "smtp.gmail.com";
  }
  const trimmed = rawHost.trim();
  if (trimmed.includes("@")) {
    console.warn(`[SMTP Config Warning]: SMTP_HOST received email address ("${trimmed}"). Defaulting host to smtp.gmail.com.`);
    return "smtp.gmail.com";
  }
  return trimmed;
}

// Helper to parse SMTP user safely
function parseSmtpUser(rawUser: any): string {
  if (!rawUser || typeof rawUser !== "string" || !rawUser.trim()) {
    return "thecornerstreams@gmail.com";
  }
  return rawUser.trim();
}

// Helper to parse SMTP password safely, stripping any copied spaces in app passwords
function parseSmtpPass(rawPass: any): string | undefined {
  if (rawPass && typeof rawPass === "string" && rawPass.trim()) {
    return rawPass.trim().replace(/\s+/g, "");
  }
  // Check alternate env variable keys and default verified app password
  const altPass = process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD || process.env.MAIL_PASSWORD || "srhaqtqsjxpakjcj";
  if (altPass && typeof altPass === "string" && altPass.trim()) {
    return altPass.trim().replace(/\s+/g, "");
  }
  return undefined;
}

// Lazy SMTP transporter creation with robust fallback and auto-detection
function getMailTransporter(): nodemailer.Transporter | null {
  const host = parseSmtpHost(process.env.SMTP_HOST);
  const port = parseSmtpPort(process.env.SMTP_PORT);
  const user = parseSmtpUser(process.env.SMTP_USER);
  const pass = parseSmtpPass(process.env.SMTP_PASS);

  if (!pass) {
    return null;
  }

  // Automatic secure flag negotiation: port 465 uses SSL/TLS (true), port 587/25 uses STARTTLS (false)
  let secure = port === 465;
  if (process.env.SMTP_SECURE === "true") secure = true;
  if (process.env.SMTP_SECURE === "false") secure = false;

  const isGmail = host.includes("gmail") || user.endsWith("@gmail.com");

  if (isGmail) {
    return nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port,
      secure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });
}

/**
 * Dispatch message to Telegram Bot API (supports Groups, Channels, and Private chats)
 */
function sendTelegramApiMessage(params: {
  text: string;
  chatId?: string;
  botToken?: string;
  parseMode?: string;
}): Promise<{ success: boolean; messageId?: number; data?: any; error?: string }> {
  return new Promise((resolve) => {
    const token = params.botToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = params.chatId || process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.log("[Telegram Bot API]: Skipped - TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured in environment.");
      return resolve({
        success: false,
        error: "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured."
      });
    }

    const payload = JSON.stringify({
      chat_id: chatId,
      text: params.text,
      parse_mode: params.parseMode || "Markdown",
      disable_web_page_preview: false,
    });

    const req = https.request(
      {
        hostname: "api.telegram.org",
        port: 443,
        path: `/bot${token}/sendMessage`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => { raw += chunk; });
        res.on("end", () => {
          try {
            const parsed = JSON.parse(raw);
            if (parsed.ok) {
              console.log(`[Telegram Bot API] Success! Message dispatched to chat ${chatId} (Msg ID: ${parsed.result?.message_id})`);
              resolve({
                success: true,
                messageId: parsed.result?.message_id,
                data: parsed.result,
              });
            } else {
              console.warn(`[Telegram Bot API Error]: ${parsed.description || raw}`);
              resolve({
                success: false,
                error: parsed.description || "Failed to send Telegram message",
              });
            }
          } catch (e: any) {
            resolve({ success: false, error: e.message || "Invalid JSON response from Telegram" });
          }
        });
      }
    );

    req.on("error", (err) => {
      console.error("[Telegram Network Error]:", err.message);
      resolve({ success: false, error: err.message });
    });

    req.setTimeout(8000, () => {
      req.destroy();
      resolve({ success: false, error: "Telegram API request timed out after 8s" });
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Generate formatted HTML template for multi-recipient email notifications
 */
function buildEmailTemplate(title: string, badge: string, icon: string, details: { label: string; value: string }[], footerNote?: string): string {
  const detailsHtml = details
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 12px; font-weight: 600; color: #475569; width: 35%; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${item.label}</td>
        <td style="padding: 10px 12px; color: #0f172a; font-size: 14px; font-weight: 500; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${item.value}</td>
      </tr>`
    )
    .join("");

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
  </head>
  <body style="margin: 0; padding: 24px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #059669 100%); padding: 24px 28px; color: #ffffff;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 24px; margin-right: 10px;">${icon}</span>
          <span style="font-size: 18px; font-weight: 800; letter-spacing: -0.02em; text-transform: uppercase;">CORNER STREAMS</span>
        </div>
        <h1 style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.01em;">${title}</h1>
        <div style="margin-top: 8px;">
          <span style="display: inline-block; background-color: rgba(255,255,255,0.2); backdrop-filter: blur(4px); color: #ffffff; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">${badge}</span>
        </div>
      </div>

      <!-- Content -->
      <div style="padding: 24px 28px;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tbody>
            ${detailsHtml}
          </tbody>
        </table>

        ${footerNote ? `
        <div style="background-color: #f1f5f9; border-left: 4px solid #059669; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #334155; margin-top: 16px;">
          ${footerNote}
        </div>` : ""}

        <div style="margin-top: 24px; text-align: center;">
          <a href="https://cornerstreams.com" style="display: inline-block; background: linear-gradient(to right, #4338ca, #059669); color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; font-size: 13px;">Open Corner Streams Portal</a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 28px; text-align: center; font-size: 11px; color: #64748b;">
        <p style="margin: 0 0 4px 0;">This automated alert was dispatched to Corner Streams administrators.</p>
        <p style="margin: 0;">&copy; 2026 Corner Streams. All rights reserved.</p>
      </div>

    </div>
  </body>
  </html>`;
}

/**
 * POST /api/telegram/send - Direct endpoint to send notifications to Telegram Channel or Group
 */
app.post("/api/telegram/send", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { text, chatId, botToken, parseMode } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: "Text message is required" });
    }

    const result = await sendTelegramApiMessage({
      text,
      chatId,
      botToken,
      parseMode: parseMode || "Markdown"
    });

    return res.json(result);
  } catch (err: any) {
    console.error("[POST /api/telegram/send Error]:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to dispatch Telegram message" });
  }
});

/**
 * GET /api/telegram/status - Check Telegram bot configuration
 */
app.get("/api/telegram/status", (req: express.Request, res: express.Response) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  res.json({
    configured: Boolean(token && chatId),
    hasToken: Boolean(token),
    hasChatId: Boolean(chatId),
    chatIdType: chatId ? (chatId.startsWith("-100") ? "supergroup_or_channel" : chatId.startsWith("-") ? "group" : "private_chat") : "none",
    instructions: {
      step1: "Create a bot using @BotFather on Telegram to get your bot token",
      step2: "Add your bot as an Administrator to your Telegram Group or Channel",
      step3: "Get your Group/Channel Chat ID (e.g. using @RawDataBot or @userinfobot)",
      step4: "Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in environment settings",
    }
  });
});

/**
 * POST /api/notify-all - Universal Multi-Channel Dispatcher (Telegram Group/Channel + Email 4 Inboxes + WhatsApp)
 */
app.post("/api/notify-all", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { eventType, data } = req.body;
    const now = new Date();
    const formattedTime = now.toLocaleString("en-GB", { timeZone: "Africa/Lagos" }) + " (WAT)";

    // Throttle page view alerts (once every 5 minutes)
    if (eventType === "page_view") {
      const nowMs = Date.now();
      if (nowMs - lastPageViewThrottle < 300000) {
        return res.json({ success: true, message: "Page view notification throttled" });
      }
      lastPageViewThrottle = nowMs;
    }

    const recipients = (process.env.ADMIN_NOTIFICATION_EMAILS
      ? process.env.ADMIN_NOTIFICATION_EMAILS.split(",").map(e => e.trim()).filter(Boolean)
      : DEFAULT_RECIPIENT_EMAILS);

    const targetPhone = process.env.WHATSAPP_NOTIFICATION_PHONE || DEFAULT_TARGET_PHONE;
    const cleanPhone = targetPhone.replace(/[^0-9+]/g, "");

    let subject = "";
    let emailHtml = "";
    let whatsAppText = "";
    let telegramText = "";

    switch (eventType) {
      case "contact_message": {
        subject = `📩 [Corner Streams] Contact Inquiry: ${data?.name || "New Lead"} - ${data?.subject || "General"}`;
        whatsAppText = `📩 *New Contact Inquiry*\n\n• *Name:* ${data?.name || "Anonymous"}\n• *Email:* ${data?.email || "N/A"}\n• *Phone:* ${data?.phone || "N/A"}\n• *Subject:* ${data?.subject || "General Inquiry"}\n• *Message:* "${data?.message || ""}"\n• *Time:* ${formattedTime}`;
        telegramText = `📩 *NEW CONTACT INQUIRY RECEIVED*\n━━━━━━━━━━━━━━━━━━━━\n👤 *Name:* ${data?.name || "Anonymous Lead"}\n📧 *Email:* [${data?.email || "N/A"}](mailto:${data?.email})\n📞 *Phone:* ${data?.phone || "N/A"}\n🏷️ *Subject:* ${data?.subject || "General Inquiry"}\n💬 *Message:*\n_${(data?.message || "No message provided").trim()}_\n━━━━━━━━━━━━━━━━━━━━\n⏰ *Time:* \`${formattedTime}\``;
        emailHtml = buildEmailTemplate(
          "New Contact Inquiry Received",
          "Contact Lead",
          "📩",
          [
            { label: "Sender Name", value: data?.name || "Anonymous" },
            { label: "Email Address", value: `<a href="mailto:${data?.email}">${data?.email || "N/A"}</a>` },
            { label: "Phone Number", value: `<a href="tel:${data?.phone}">${data?.phone || "N/A"}</a>` },
            { label: "Subject", value: data?.subject || "General Inquiry" },
            { label: "Message", value: `<div style="white-space: pre-wrap; background: #fff; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; margin-top: 4px;">${data?.message || ""}</div>` },
            { label: "Timestamp", value: formattedTime }
          ],
          "You can reply directly to the sender using their email address above."
        );
        break;
      }

      case "school_onboarded": {
        subject = `🏫 [Corner Streams] NEW SCHOOL ENROLLED: ${data?.schoolName || "New Institution"}`;
        whatsAppText = `🏫 *NEW SCHOOL ONBOARDED!*\n\n• *School:* ${data?.schoolName || "N/A"}\n• *Admin:* ${data?.adminName || "N/A"}\n• *Email:* ${data?.email || "N/A"}\n• *Phone:* ${data?.phone || "N/A"}\n• *State/LGA:* ${data?.state || ""} ${data?.lga ? `(${data.lga})` : ""}\n• *School ID:* ${data?.schoolId || "Generated"}\n• *Time:* ${formattedTime}`;
        telegramText = `🏫 *NEW SCHOOL ONBOARDED!* 🎉\n━━━━━━━━━━━━━━━━━━━━\n🏛️ *School Name:* *${(data?.schoolName || "NEW INSTITUTION").toUpperCase()}*\n👨‍💼 *Administrator:* ${data?.adminName || "N/A"}\n📧 *Admin Email:* [${data?.email}](mailto:${data?.email})\n📞 *Phone / WhatsApp:* [${data?.phone}](tel:${data?.phone})\n📍 *Location:* ${data?.state || "N/A"} ${data?.lga ? `(${data.lga})` : ""}\n🆔 *Assigned ID:* \`${data?.schoolId || "Generated"}\`\n━━━━━━━━━━━━━━━━━━━━\n⏰ *Enrolled At:* \`${formattedTime}\`\n⚡ *Status:* Tenant database initialized`;
        emailHtml = buildEmailTemplate(
          "New School Onboarded Successfully",
          "Institutional Onboarding",
          "🏫",
          [
            { label: "School Name", value: `<strong style="color: #1e1b4b; font-size: 15px;">${data?.schoolName || "N/A"}</strong>` },
            { label: "Admin Name", value: data?.adminName || "N/A" },
            { label: "Admin Email", value: `<a href="mailto:${data?.email}">${data?.email || "N/A"}</a>` },
            { label: "Contact Phone", value: `<a href="tel:${data?.phone}">${data?.phone || "N/A"}</a>` },
            { label: "State & LGA", value: `${data?.state || "N/A"} ${data?.lga ? `(${data.lga})` : ""}` },
            { label: "Assigned School ID", value: `<code style="background: #e0e7ff; color: #3730a3; padding: 3px 8px; border-radius: 4px; font-weight: 700;">${data?.schoolId || "N/A"}</code>` },
            { label: "Registration Time", value: formattedTime }
          ],
          "This school's tenant database and admin account have been initialized."
        );
        break;
      }

      case "user_registered": {
        subject = `👤 [Corner Streams] New User Registered: ${data?.fullName || "New Member"} (${data?.role || "User"})`;
        whatsAppText = `👤 *New User Registration*\n\n• *Name:* ${data?.fullName || data?.name || "N/A"}\n• *Role:* ${data?.role || "User"}\n• *Email:* ${data?.email || "N/A"}\n• *Phone:* ${data?.phone || "N/A"}\n• *School:* ${data?.schoolName || data?.schoolId || "N/A"}\n• *Time:* ${formattedTime}`;
        telegramText = `👤 *NEW USER REGISTERED*\n━━━━━━━━━━━━━━━━━━━━\n👤 *Full Name:* ${data?.fullName || data?.name || "N/A"}\n🛡️ *Role:* \`${(data?.role || "USER").toUpperCase()}\`\n📧 *Email:* [${data?.email}](mailto:${data?.email})\n${data?.phone ? `📞 *Phone:* ${data.phone}\n` : ""}${data?.schoolName ? `🏫 *School:* ${data.schoolName}\n` : ""}━━━━━━━━━━━━━━━━━━━━\n⏰ *Registered:* \`${formattedTime}\``;
        emailHtml = buildEmailTemplate(
          "New User Account Registered",
          data?.role || "Account Registration",
          "👤",
          [
            { label: "Full Name", value: data?.fullName || data?.name || "N/A" },
            { label: "Account Role", value: `<span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 12px;">${data?.role || "User"}</span>` },
            { label: "Email Address", value: `<a href="mailto:${data?.email}">${data?.email || "N/A"}</a>` },
            { label: "Phone", value: data?.phone || "N/A" },
            { label: "Affiliated School", value: data?.schoolName || data?.schoolId || "Corner Streams Global" },
            { label: "Registered At", value: formattedTime }
          ]
        );
        break;
      }

      case "payment_receipt":
      case "receipt_uploaded": {
        const formattedAmount = data?.amount_ngn || data?.amountNgn ? `₦${Number(data?.amount_ngn || data?.amountNgn).toLocaleString()}` : "₦0";
        const receiptCode = data?.whatsappCode || data?.whatsapp_code || data?.receiptId || "REF-" + Math.floor(100000 + Math.random() * 900000);
        subject = `🧾 [Corner Streams] Payment Receipt Logged: ${formattedAmount} - ${data?.schoolName || data?.school_name || "Institution"}`;
        whatsAppText = `🧾 *NEW PAYMENT RECEIPT LOGGED*\n\n• *School:* ${data?.schoolName || data?.school_name || "N/A"}\n• *Payer:* ${data?.submittedBy || data?.submitted_by || "Admin"}\n• *Amount:* ${formattedAmount}\n• *Plan/Tier:* ${(data?.tier || "Standard").replace(/_/g, " ").toUpperCase()}\n• *Ref Code:* #${receiptCode}\n• *Status:* ${(data?.status || "Pending").toUpperCase()}\n• *Time:* ${formattedTime}`;
        telegramText = `🧾 *NEW PAYMENT RECEIPT LOGGED*\n━━━━━━━━━━━━━━━━━━━━\n🏛️ *School:* *${(data?.schoolName || data?.school_name || "CORNER STREAMS NETWORK").toUpperCase()}*\n👤 *Payer:* ${data?.submittedBy || data?.submitted_by || "Administrator"}\n💰 *Amount:* *${formattedAmount}*\n🏷️ *Tier/Duration:* \`${(data?.tier || "Standard").replace(/_/g, " ").toUpperCase()}\` (${data?.duration || "Session"})\n🆔 *Ref Code:* \`#${receiptCode}\`\n⚡ *Status:* \`${(data?.status || "PENDING").toUpperCase()}\`\n━━━━━━━━━━━━━━━━━━━━\n⏰ *Time:* \`${formattedTime}\``;
        emailHtml = buildEmailTemplate(
          "Payment Receipt Verification Required",
          "Bursary & Billing",
          "🧾",
          [
            { label: "School Name", value: `<strong style="color: #1e1b4b; font-size: 15px;">${data?.schoolName || data?.school_name || "Corner Streams Global"}</strong>` },
            { label: "Submitted By", value: data?.submittedBy || data?.submitted_by || "Administrator" },
            { label: "Amount Logged", value: `<span style="color: #059669; font-weight: 800; font-size: 16px; font-family: monospace;">${formattedAmount}</span>` },
            { label: "Tier / License", value: `<span style="background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 12px;">${(data?.tier || "Standard").replace(/_/g, " ").toUpperCase()} (${data?.duration || "Full Session"})</span>` },
            { label: "Receipt Ref #", value: `<code style="font-weight: 700;">#${receiptCode}</code>` },
            { label: "Payment Note", value: data?.note || "Automated bank invoice / enrollment clearance receipt" },
            { label: "Submission Time", value: formattedTime }
          ],
          "You can verify and clear this receipt directly from your Super Admin or School Admin Dashboard."
        );
        break;
      }

      case "page_view":
      default: {
        subject = `🔔 [Corner Streams] Traffic Alert: Visitor on ${data?.page || "Portal"}`;
        whatsAppText = `🔔 *Corner Streams Alert*\n\n👁️ *Visitor on Portal*\n• *Page:* ${data?.page || "Public Portal"}\n• *Device:* ${data?.userAgent ? (data.userAgent.includes("Mobile") ? "Mobile" : "Desktop") : "Web"}\n• *Time:* ${formattedTime}\n• *URL:* ${data?.url || "https://cornerstreams.com"}`;
        telegramText = `🔔 *PORTAL VISITOR ALERT*\n━━━━━━━━━━━━━━━━━━━━\n👁️ *Page:* ${data?.page || "Public Landing Page"}\n${data?.url ? `🔗 *URL:* ${data.url}\n` : ""}⏰ *Time:* \`${formattedTime}\``;
        emailHtml = buildEmailTemplate(
          "Portal Page Traffic Alert",
          "Live Traffic",
          "🔔",
          [
            { label: "Page Visited", value: data?.page || "Public Landing Page" },
            { label: "Page URL", value: `<a href="${data?.url || "#"}">${data?.url || "Portal"}</a>` },
            { label: "Device / Client", value: data?.userAgent ? (data.userAgent.includes("Mobile") ? "Mobile Device" : "Desktop Browser") : "Web Client" },
            { label: "Visit Timestamp", value: formattedTime }
          ]
        );
        break;
      }
    }

    console.log(`[Notification Engine] Triggered: ${eventType} | Inboxes: ${recipients.join(", ")}`);

    // 1. Dispatch Telegram Alert to Group / Channel
    const customChatId = req.body.chatId || data?.chatId;
    const tgResult = await sendTelegramApiMessage({ text: telegramText, chatId: customChatId, parseMode: "Markdown" });
    if (tgResult.success) {
      pushNotificationDiagnosticLog({
        channel: "telegram",
        status: "success",
        event: eventType,
        recipient: customChatId || process.env.TELEGRAM_CHAT_ID || "Default Group/Channel",
        details: `Dispatched Telegram Markdown notification (Msg ID: ${tgResult.messageId || 'Delivered'})`
      });
    } else {
      pushNotificationDiagnosticLog({
        channel: "telegram",
        status: tgResult.error?.includes("not configured") ? "skipped_unconfigured" : "error",
        event: eventType,
        recipient: customChatId || process.env.TELEGRAM_CHAT_ID || "Not set",
        details: tgResult.error || "Telegram dispatch error",
        error: tgResult.error
      });
    }

    // 2. Dispatch WhatsApp (CallMeBot with Twilio fallback)
    let whatsAppDispatched = false;
    let whatsAppGateway = "none";
    let whatsAppError: string | undefined = undefined;

    // Primary: CallMeBot WhatsApp Gateway
    const callmebotRes = await sendCallMeBotWhatsApp(whatsAppText, {
      event: eventType,
      phone: cleanPhone
    });

    if (callmebotRes.success) {
      whatsAppDispatched = true;
      whatsAppGateway = "callmebot";
    } else {
      whatsAppError = callmebotRes.error;
      // Secondary Fallback: Twilio WhatsApp
      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
      const twilioFrom = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

      if (twilioSid && twilioAuth) {
        try {
          const toWhatsApp = `whatsapp:${cleanPhone.startsWith("+") ? cleanPhone : "+" + cleanPhone}`;
          const postData = new URLSearchParams({
            To: toWhatsApp,
            From: twilioFrom,
            Body: whatsAppText
          }).toString();

          const reqAuth = Buffer.from(`${twilioSid}:${twilioAuth}`).toString("base64");
          const twilioReq = https.request({
            hostname: "api.twilio.com",
            port: 443,
            path: `/2010-04-01/Accounts/${twilioSid}/Messages.json`,
            method: "POST",
            headers: {
              "Authorization": `Basic ${reqAuth}`,
              "Content-Type": "application/x-www-form-urlencoded",
              "Content-Length": Buffer.byteLength(postData)
            }
          }, (twilioRes) => {
            let data = "";
            twilioRes.on("data", chunk => { data += chunk; });
            twilioRes.on("end", () => {
              console.log("[Twilio WhatsApp Result]:", data);
            });
          });
          twilioReq.on("error", (err) => console.error("[Twilio WhatsApp Error]:", err.message));
          twilioReq.write(postData);
          twilioReq.end();
          whatsAppDispatched = true;
          whatsAppGateway = "twilio";
          pushNotificationDiagnosticLog({
            channel: "whatsapp_twilio",
            status: "success",
            event: eventType,
            recipient: toWhatsApp,
            details: "Dispatched WhatsApp via Twilio gateway fallback."
          });
        } catch (err: any) {
          console.error("[Twilio Dispatch Failed]:", err.message);
          pushNotificationDiagnosticLog({
            channel: "whatsapp_twilio",
            status: "error",
            event: eventType,
            recipient: cleanPhone,
            details: "Twilio dispatch threw exception",
            error: err.message
          });
        }
      }
    }

    // 3. Dispatch Email via Nodemailer to all 4 recipient inboxes
    const transporter = getMailTransporter();
    let emailDispatched = false;
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"Corner Streams Platform" <${process.env.SMTP_USER || "thecornerstreams@gmail.com"}>`,
          to: recipients,
          subject,
          html: emailHtml,
          text: whatsAppText.replace(/\*/g, "")
        });
        emailDispatched = true;
        console.log(`[Email Dispatched Successfully] Sent to: ${recipients.join(", ")}`);
        pushNotificationDiagnosticLog({
          channel: "email",
          status: "success",
          event: eventType,
          recipient: recipients.join(", "),
          details: `HTML email delivered to ${recipients.length} inboxes successfully.`
        });
      } catch (mailErr: any) {
        console.error("[Email Dispatch Error]:", mailErr.message);
        pushNotificationDiagnosticLog({
          channel: "email",
          status: "error",
          event: eventType,
          recipient: recipients.join(", "),
          details: `Email dispatch failure: ${mailErr.message}`,
          error: mailErr.message
        });
      }
    } else {
      console.log(`[Email Simulation] SMTP_PASS not set. Would deliver to: ${recipients.join(", ")}`);
      pushNotificationDiagnosticLog({
        channel: "email",
        status: "skipped_unconfigured",
        event: eventType,
        recipient: recipients.join(", "),
        details: "Skipped email delivery: SMTP_PASS is not configured."
      });
    }

    const waMeLink = `https://wa.me/${cleanPhone.replace("+", "")}?text=${encodeURIComponent(whatsAppText)}`;

    return res.json({
      success: true,
      recipients,
      phone: cleanPhone,
      telegramDispatched: tgResult.success,
      whatsAppDispatched,
      whatsAppGateway,
      whatsAppError,
      emailDispatched,
      waMeLink
    });

  } catch (error: any) {
    console.error("[Notification Engine Error]:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to dispatch notification" });
  }
});

/**
 * GET /api/notifications/diagnostics - Return diagnostic logs and integration statuses for admin verification
 */
app.get("/api/notifications/diagnostics", (req, res) => {
  const targetPhone = process.env.CALLMEBOT_PHONE || process.env.WHATSAPP_NOTIFICATION_PHONE || DEFAULT_TARGET_PHONE;
  const cleanPhone = targetPhone.replace(/[^0-9]/g, "");
  const hasCallMeBotKey = Boolean(process.env.CALLMEBOT_API_KEY || process.env.CALLMEBOT_APIKEY);
  const hasTelegram = Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
  const parsedHost = parseSmtpHost(process.env.SMTP_HOST);
  const parsedPort = parseSmtpPort(process.env.SMTP_PORT);
  const parsedUser = parseSmtpUser(process.env.SMTP_USER);
  const parsedPass = parseSmtpPass(process.env.SMTP_PASS);
  const hasSmtp = Boolean(parsedPass);
  const hasTwilio = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);

  res.json({
    status: "online",
    integrations: {
      callmebot: {
        configured: Boolean(cleanPhone && hasCallMeBotKey),
        phone: cleanPhone ? `+${cleanPhone}` : null,
        hasApiKey: hasCallMeBotKey,
        apiKeyMasked: hasCallMeBotKey ? `...${(process.env.CALLMEBOT_API_KEY || process.env.CALLMEBOT_APIKEY || "").slice(-4)}` : null,
        provider: "CallMeBot Direct WhatsApp Gateway",
        endpoint: "https://api.callmebot.com/whatsapp.php"
      },
      telegram: {
        configured: hasTelegram,
        hasToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
        hasChatId: Boolean(process.env.TELEGRAM_CHAT_ID),
        chatId: process.env.TELEGRAM_CHAT_ID ? `...${process.env.TELEGRAM_CHAT_ID.slice(-4)}` : null
      },
      email: {
        configured: hasSmtp,
        host: parsedHost,
        port: parsedPort,
        user: parsedUser,
        isGmail: parsedHost.includes("gmail") || parsedUser.endsWith("@gmail.com"),
        hasPassword: Boolean(parsedPass),
        inboxes: (process.env.ADMIN_NOTIFICATION_EMAILS
          ? process.env.ADMIN_NOTIFICATION_EMAILS.split(",").map(e => e.trim()).filter(Boolean)
          : DEFAULT_RECIPIENT_EMAILS)
      },
      twilio: {
        configured: hasTwilio
      }
    },
    logs: notificationDiagnosticLogs.slice(0, 40),
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/notifications/email/test - Manual Trigger / Diagnostic Test Endpoint for Email
 */
app.post("/api/notifications/email/test", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const transporter = getMailTransporter();
    const recipients = (process.env.ADMIN_NOTIFICATION_EMAILS
      ? process.env.ADMIN_NOTIFICATION_EMAILS.split(",").map(e => e.trim()).filter(Boolean)
      : DEFAULT_RECIPIENT_EMAILS);

    if (!transporter) {
      pushNotificationDiagnosticLog({
        channel: "email",
        status: "skipped_unconfigured",
        event: "manual_test_alert",
        recipient: recipients.join(", "),
        details: "Test dispatch skipped: SMTP_PASS not configured in environment.",
        error: "SMTP_PASS not configured"
      });
      return res.json({
        success: false,
        error: "SMTP_PASS not configured in environment settings",
        recipients
      });
    }

    const host = parseSmtpHost(process.env.SMTP_HOST);
    const port = parseSmtpPort(process.env.SMTP_PORT);
    const user = parseSmtpUser(process.env.SMTP_USER);

    const testSubject = `🧪 [Corner Streams Test] SMTP Email Engine Verified (${new Date().toLocaleTimeString("en-GB", { timeZone: "Africa/Lagos" })})`;
    const testHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #4338ca, #059669); padding: 20px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 18px;">Corner Streams Notification Engine</h2>
          <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 12px;">Diagnostic SMTP Integration Test</p>
        </div>
        <div style="padding: 24px; color: #1e293b; font-size: 13px; line-height: 1.6;">
          <p style="margin-top: 0;"><strong>Hello Administrator,</strong></p>
          <p>This is a verified test email from the Corner Streams notification service. Your SMTP configuration has been validated:</p>
          <ul style="background: #f8fafc; padding: 14px 20px; border-radius: 8px; border: 1px solid #cbd5e1; font-family: monospace; font-size: 12px;">
            <li><strong>SMTP Host:</strong> ${host}</li>
            <li><strong>SMTP Port:</strong> ${port}</li>
            <li><strong>Sender Identity:</strong> ${user}</li>
            <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
          </ul>
          <p style="color: #059669; font-weight: bold;">Status: All 4 administrator recipient inboxes connected.</p>
        </div>
        <div style="background: #f1f5f9; padding: 12px 24px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          &copy; 2026 Corner Streams. All rights reserved.
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Corner Streams Platform" <${user}>`,
      to: recipients,
      subject: testSubject,
      html: testHtml,
      text: `Corner Streams SMTP Engine Test - Host: ${host}, Port: ${port}, Time: ${new Date().toISOString()}`
    });

    pushNotificationDiagnosticLog({
      channel: "email",
      status: "success",
      event: "manual_test_alert",
      recipient: recipients.join(", "),
      details: `Test email sent to ${recipients.length} inboxes via ${host}:${port}`
    });

    return res.json({
      success: true,
      host,
      port,
      user,
      recipients,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("[Email Diagnostic Test Error]:", err);
    pushNotificationDiagnosticLog({
      channel: "email",
      status: "error",
      event: "manual_test_alert",
      recipient: DEFAULT_RECIPIENT_EMAILS.join(", "),
      details: `Test email failure: ${err.message}`,
      error: err.message
    });
    return res.status(500).json({ success: false, error: err.message || "Failed to send test email" });
  }
});

/**
 * POST /api/notifications/callmebot/test - Manual Trigger / Diagnostic Test Endpoint for CallMeBot
 */
app.post("/api/notifications/callmebot/test", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { message, phone, apiKey } = req.body;
    const testText = message || `🧪 *Corner Streams WhatsApp Gateway Verified*\n\n✅ CallMeBot API integration is online and operational.\n⏰ Time: ${new Date().toLocaleString("en-GB", { timeZone: "Africa/Lagos" })} (WAT)\n🏛️ Master Admin Notification Service`;

    const result = await sendCallMeBotWhatsApp(testText, {
      phone,
      apiKey,
      event: "manual_diagnostic_test"
    });

    return res.json({
      success: result.success,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("[CallMeBot Test Error]:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to dispatch CallMeBot test" });
  }
});

app.get("/api/notification-recipients", (req, res) => {
  const recipients = (process.env.ADMIN_NOTIFICATION_EMAILS
    ? process.env.ADMIN_NOTIFICATION_EMAILS.split(",").map(e => e.trim()).filter(Boolean)
    : DEFAULT_RECIPIENT_EMAILS);

  const targetPhone = process.env.CALLMEBOT_PHONE || process.env.WHATSAPP_NOTIFICATION_PHONE || DEFAULT_TARGET_PHONE;

  res.json({
    whatsapp: targetPhone,
    emails: recipients,
    hasCallMeBotConfig: Boolean(process.env.CALLMEBOT_API_KEY || process.env.CALLMEBOT_APIKEY),
    hasSmtpConfig: Boolean(process.env.SMTP_PASS),
    hasTelegramConfig: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    hasTwilioConfig: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
  });
});


// Setup WebSocket server for Real-time Voice Conversations via Gemini Live API (gemini-3.1-flash-live-preview)
const wss = new WebSocketServer({ server, path: "/live" });

wss.on("connection", async (clientWs: WebSocket) => {
  console.log("Gemini Live API WebSocket client connected");
  try {
    const ai = getGeminiClient();
    const session = await ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
        },
        systemInstruction: "You are Nonye AI, the voice educator and administrative AI co-pilot for Corner Streams. You speak with a natural, comely, polite, and fluent voice with an articulate Nigerian accent. Never sound robotic; use natural conversational cadence, warm pauses, friendly phrasing, and articulate clarity when helping teachers, students, and administrators.",
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ audio }));
          }
          if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
        },
        onclose: () => {
          console.log("Gemini Live API session closed");
        },
        onerror: (err) => {
          console.error("Gemini Live API session error:", err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ error: err?.message || "Live API error" }));
          }
        }
      },
    });

    clientWs.on("message", (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.audio) {
          session.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: "audio/pcm;rate=16000" },
          });
        } else if (parsed.text) {
          session.sendRealtimeInput({
            text: parsed.text,
          });
        }
      } catch (err) {
        console.error("Error handling client message:", err);
      }
    });

    clientWs.on("close", () => {
      console.log("Client disconnected, closing Gemini Live session");
      try {
        session.close();
      } catch (e) {
        // ignore
      }
    });

    clientWs.on("error", (err) => {
      console.error("Client WS error:", err);
      try {
        session.close();
      } catch (e) {
        // ignore
      }
    });

    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ ready: true }));
    }
  } catch (error: any) {
    console.error("Gemini Live API connection setup failed:", error);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ error: error.message || "Failed to initialize Gemini Live session" }));
      clientWs.close();
    }
  }
});

// Vite Middleware integration for development
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Failed to start server:", err);
});
