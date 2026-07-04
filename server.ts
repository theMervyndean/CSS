import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
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

// REST API for Gemini AI question generation
app.post("/api/cbt/generate-questions", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { topic, numQuestions = 5, gradeLevel = "Grade 11 / SS 2", subject = "Mathematics" } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: "A topic or concept is required to generate questions." });
    }

    const ai = getGeminiClient();

    const prompt = `Generate exactly ${numQuestions} multiple-choice test questions about the topic: "${topic}" for the subject "${subject}" targeted at "${gradeLevel}" level. 
Each question must have exactly 4 plausible option choices, and a correctOptionIndex (0-3 representing A, B, C, D).
Ensure the questions are academically accurate, clear, and relevant to the selected grade level. 
Provide a "marks" value of 10 for each question.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert curriculum writer and school academic assessor. Generate accurate, standard examination questions with multiple-choice options according to the requested level and schema.",
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
              marks: {
                type: Type.INTEGER,
                description: "The marks/points awarded for this question (usually 10)."
              }
            },
            required: ["text", "options", "correctOptionIndex", "marks"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No response received from Gemini API.");
    }

    const generatedQuestions = JSON.parse(jsonText.trim());
    return res.json({ questions: generatedQuestions });

  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    return res.status(500).json({ 
      error: error.message || "An unexpected error occurred during AI question generation." 
    });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Failed to start server:", err);
});
