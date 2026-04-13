import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TaskSubsetSchema = z.array(z.object({
  id: z.string(),
  title: z.string(),
  smart: z.any()
}));

export const PrioritiseRequestSchema = z.object({
  tasks: TaskSubsetSchema
});

export const prioritiseTasks = createServerFn({ method: "POST" })
  .handler(async (ctx: { data: unknown }) => {
    const { tasks } = PrioritiseRequestSchema.parse(ctx.data);
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error("Server misconfiguration: Gemini API key is missing");
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: `You are Nudge, an intelligent task prioritisation engine. 
You will be given a JSON array of actionable tasks that exist in the user's backlog.
Each task has an id, a title, and its SMART constraints (including timeBound deadlines).

Your job is to identify the single most critical task for the user to tackle NEXT.
Weigh impending deadlines, scope, and relevance.

Return a plain JSON object with exactly one key "suggestedTaskId" containing the string ID of the highest priority task:
{"suggestedTaskId": "123-abc-456"}
No markdown wrappers, pure JSON.`
            }]
          },
          contents: [{
            parts: [{
              text: JSON.stringify(tasks)
            }]
          }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
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
      
      const parsed = JSON.parse(content);
      return parsed.suggestedTaskId as string;

    } catch (error: any) {
      console.error("AI Prioritisation Error: ", error);
      throw new Error(error.message || "Failed to prioritise tasks.");
    }
  });
