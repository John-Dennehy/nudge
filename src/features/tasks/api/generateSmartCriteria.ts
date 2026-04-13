import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Create Zod Schema to eliminate code smells & securely type the payload
export const SmartRequestSchema = z.object({
  title: z.string(),
  contextAnswers: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).default([]),
  overrides: z.array(z.string()).default([])
});

export type SmartRequestType = z.infer<typeof SmartRequestSchema>;

export interface EvaluatedCriterion {
  met: boolean;
  statement: string | null;
  question: string | null;
}

export interface TimeBoundCriterion extends EvaluatedCriterion {
  requiresDate: boolean;
}

export interface SmartAssessment {
  specific: EvaluatedCriterion;
  measurable: EvaluatedCriterion;
  achievable: EvaluatedCriterion;
  relevant: EvaluatedCriterion;
  timeBound: TimeBoundCriterion;
  isComplete: boolean;
  demultiplexer?: {
    requiresSplitting: boolean;
    suggestedSplits: string[];
    suggestedPrerequisites: string[];
  };
}

export const generateSmartCriteria = createServerFn({ method: "POST" })
  .handler(async (ctx: { data: unknown }): Promise<SmartAssessment | null> => {
    // 1. Validate payload securely
    const { title, contextAnswers, overrides } = SmartRequestSchema.parse(ctx.data);
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error("Server misconfiguration: Gemini API key is missing");
    }

    // 2. Build the history context for the AI
    const historyText = contextAnswers.length > 0 
      ? `\nThe user has provided further clarifying context:\n${contextAnswers.map(c => `Q: ${c.question}\nA: ${c.answer}`).join("\n")}`
      : "";
      
    const overrideText = overrides.length > 0
      ? `\nCRITICAL INSTRUCTION: The user has EXPLICITLY OVERRIDDEN the following criteria: [${overrides.join(", ")}]. For these specific criteria, you MUST return met=true and statement='User Confirmed', with no further questions.`
      : "";

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: `You are Nudge, an intelligent task evaluator. You analyze a user's task and determine if it meets the SMART criteria framework (Specific, Measurable, Achievable, Relevant, TimeBound).
Your goal is to converse with the user to gather context until all criteria are firmly met.
You will be provided with the original 'Vague Task Idea', and potentially some clarifying 'Context' from the user answering your questions.

Evaluate each of the 5 traits. For each trait:
- 'met': boolean representing if there is currently enough context to consider this trait satisfied.
- 'statement': If met=true, provide a short 1-2 sentence actionable description of that constraint. If met=false, return null.
- 'question': If met=false, ask a single, natural, highly-focused question to prompt the user to provide that context. If met=true, return null.
- For TimeBound ONLY, if met=false, add 'requiresDate': true if the question explicitly asks for a deadline.

PROJECT DEMULTIPLEXING:
Additionally, evaluate if the overarching goal is actually a massive "Project" masquerading as a task (e.g., "Build an entire web app"). If it is too large for a single sitting or requires distinct multi-step phases, set 'requiresSplitting' to true and return 2-4 bite-sized sub-tasks in 'suggestedSplits'.
If the task has clear blocking prerequisites that must be accomplished *before* this task can even be attempted, return them as string titles in 'suggestedPrerequisites'.

Return ONLY a JSON object exactly matching this structure, with no markdown wrappers:
{
  "specific": { "met": boolean, "statement": string|null, "question": string|null },
  "measurable": { "met": boolean, "statement": string|null, "question": string|null },
  "achievable": { "met": boolean, "statement": string|null, "question": string|null },
  "relevant": { "met": boolean, "statement": string|null, "question": string|null },
  "timeBound": { "met": boolean, "statement": string|null, "question": string|null, "requiresDate": boolean },
  "demultiplexer": { "requiresSplitting": boolean, "suggestedSplits": [], "suggestedPrerequisites": [] }
}`
            }]
          },
          contents: [{
            parts: [{
              text: `Vague task idea: "${title}"${historyText}${overrideText}`
            }]
          }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2, // Lower temperature for logic evaluation consistency
          },
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || "Failed to communicate with Gemini");
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) throw new Error("Empty response from AI");
      
      const parsed: SmartAssessment = JSON.parse(content);
      
      // Determine overall completion
      parsed.isComplete = parsed.specific.met && 
                           parsed.measurable.met && 
                           parsed.achievable.met && 
                           parsed.relevant.met && 
                           parsed.timeBound.met;
                           
      return parsed;

    } catch (error: any) {
      console.error("AI Evaluation Error: ", error);
      throw new Error(error.message || "Failed to evaluate Task Logic.");
    }
  });
