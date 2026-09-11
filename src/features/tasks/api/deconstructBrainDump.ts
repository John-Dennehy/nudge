import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ClarificationCard } from "@/core/types/task";

export const BrainDumpRequestSchema = z.object({
	text: z.string().min(1, "Brain dump cannot be empty"),
});

export interface DeconstructedGoal {
	title: string;
	isAtomic: boolean;
	clarificationCard?: ClarificationCard;
}

export interface DeconstructResult {
	goals: DeconstructedGoal[];
}

export const deconstructBrainDump = createServerFn({ method: "POST" }).handler(
	async (ctx: { data: unknown }): Promise<DeconstructResult> => {
		const { text } = BrainDumpRequestSchema.parse(ctx.data);
		const apiKey = process.env.GEMINI_API_KEY;

		if (!apiKey) {
			return fallbackDeconstruct(text);
		}

		try {
			const response = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						systemInstruction: {
							parts: [
								{
									text: `You are Nudge, an empathetic second-brain for people with AuDHD.
You turn raw, overwhelming brain-dumps into clear, manageable steps.

CRITICAL RULES:
1. STRICT PLAIN ENGLISH: NEVER use jargon (no "SMART", "confidence score", "deconstruct", "prerequisites"). Use warm, everyday language.
2. ATOMIC STEPS: A task is only ready if it is small (~2-15 minutes) with a clear physical start and clear finish. If it's too big (like "fix taxes" or "redesign site"), mark isAtomic: false.
3. PRE-SLICED OPTIONS: For any non-atomic task, provide a clarification question ("What's the best 5-minute starting point?") with 3 concrete physical starter options.

Return pure JSON matching this exact structure:
{
  "goals": [
    {
      "title": "Clear concise goal title in plain English",
      "isAtomic": boolean,
      "clarification": {
        "question": "Plain English question",
        "options": [
          { "label": "Concrete starter step 1", "subtext": "Takes 2 mins" },
          { "label": "Concrete starter step 2", "subtext": "Takes 5 mins" },
          { "label": "Concrete starter step 3", "subtext": "Takes 5 mins" }
        ]
      }
    }
  ]
}`,
								},
							],
						},
						contents: [
							{
								parts: [{ text: `User brain-dump:\n"${text}"` }],
							},
						],
						generationConfig: {
							responseMimeType: "application/json",
							temperature: 0.2,
						},
					}),
				},
			);

			if (!response.ok) {
				return fallbackDeconstruct(text);
			}

			const data = await response.json();
			const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
			if (!content) return fallbackDeconstruct(text);

			interface RawGoal {
				title: string;
				isAtomic: boolean;
				clarification?: {
					question?: string;
					options?: Array<{ label: string; subtext?: string }>;
				};
			}

			const parsed = JSON.parse(content);
			const goals: DeconstructedGoal[] = (
				(parsed.goals as RawGoal[]) || []
			).map((g) => {
				const goalId = crypto.randomUUID();
				let card: ClarificationCard | undefined;
				if (!g.isAtomic && g.clarification) {
					card = {
						id: crypto.randomUUID(),
						taskId: goalId,
						question:
							g.clarification.question || "What's the best way to start?",
						options: (g.clarification.options || []).map((opt) => ({
							id: crypto.randomUUID(),
							label: opt.label,
							subtext: opt.subtext,
						})),
						allowWriteIn: true,
					};
				}
				return {
					title: g.title,
					isAtomic: Boolean(g.isAtomic),
					clarificationCard: card,
				};
			});

			return {
				goals: goals.length > 0 ? goals : fallbackDeconstruct(text).goals,
			};
		} catch (e) {
			console.warn(
				"Gemini unavailable, falling back to heuristic deconstruction:",
				e,
			);
			return fallbackDeconstruct(text);
		}
	},
);

function fallbackDeconstruct(raw: string): DeconstructResult {
	const lines = raw
		.split(/\n|\band\b|;/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);

	const goals: DeconstructedGoal[] = lines.map((line) => {
		const isShort =
			line.length < 40 && !line.includes("project") && !line.includes("all");
		const goalId = crypto.randomUUID();

		if (isShort) {
			return {
				title: line,
				isAtomic: true,
			};
		}

		return {
			title: line,
			isAtomic: false,
			clarificationCard: {
				id: crypto.randomUUID(),
				taskId: goalId,
				question: "How would you like to tackle the first few minutes?",
				options: [
					{
						id: crypto.randomUUID(),
						label: `Open workspace and inspect ${line.slice(0, 25)}`,
						subtext: "2 minutes to build momentum",
					},
					{
						id: crypto.randomUUID(),
						label: "Jot down a quick 3-bullet plan",
						subtext: "5 minutes of clarifying thoughts",
					},
					{
						id: crypto.randomUUID(),
						label: "Do just the first immediate action",
						subtext: "5 minutes without looking at the rest",
					},
				],
				allowWriteIn: true,
			},
		};
	});

	return {
		goals: goals.length > 0 ? goals : [{ title: raw.trim(), isAtomic: true }],
	};
}
