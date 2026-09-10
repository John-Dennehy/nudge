import { TASK_STATE, type Task } from "@/core/types/task";

export interface UnstickResult {
	originalDump: string;
	microAction: string;
	durationMinutes: 2;
	suggestedState: "Active";
	rationale: string;
}

/**
 * Extracts a single, sub-atomic physical micro-action (the "One Fork Rule")
 * from an unstructured, overwhelming brain-dump.
 *
 * Adheres strictly to ADR 0002 and CONTEXT.md.
 */
export function extractMicroAction(brainDump: string): UnstickResult {
	if (!brainDump || !brainDump.trim()) {
		throw new Error("Brain dump cannot be empty");
	}

	const trimmed = brainDump.trim();
	const lower = trimmed.toLowerCase();

	let microAction = "";
	let rationale = "";

	if (
		lower.includes("dish") ||
		lower.includes("kitchen") ||
		lower.includes("sink")
	) {
		microAction = "Put one fork from the sink into the drawer or dishwasher";
		rationale =
			"One Fork Rule: Overcome domestic task paralysis with a sub-atomic physical movement.";
	} else if (lower.includes("laundry") || lower.includes("clothes")) {
		microAction = "Pick up one piece of clothing and place it in the basket";
		rationale = "Reduce clothing clutter paralysis to a single physical item.";
	} else if (
		lower.includes("tax") ||
		lower.includes("receipt") ||
		lower.includes("finance") ||
		lower.includes("hmrc")
	) {
		microAction =
			"Open your tax receipts folder or locate one physical receipt";
		rationale =
			"Lower the activation barrier for administrative tasks to locating a single document.";
	} else if (
		lower.includes("write") ||
		lower.includes("doc") ||
		lower.includes("essay") ||
		lower.includes("paper") ||
		lower.includes("post")
	) {
		microAction = "Open the document and write just the working title";
		rationale =
			"Break writing paralysis by establishing the document workspace.";
	} else if (
		lower.includes("email") ||
		lower.includes("inbox") ||
		lower.includes("message")
	) {
		microAction = "Open your inbox and read or archive just the first email";
		rationale =
			"Eliminate communication backlog dread by addressing only the top item.";
	} else if (
		lower.includes("code") ||
		lower.includes("bug") ||
		lower.includes("build") ||
		lower.includes("test") ||
		lower.includes("refactor")
	) {
		microAction =
			"Open the editor and read the first failing test or line of code";
		rationale =
			"Isolate technical cognitive load down to reading a single failure.";
	} else {
		// Default sub-atomic rule: find the first subject or verb and create a 30-second inspection step
		const firstSentence = trimmed.split(/[.!?\n]/)[0].trim();
		microAction = `Take 60 seconds to inspect: "${firstSentence.slice(0, 50)}"`;
		rationale =
			"General One-Fork fallback: 60-second visual grounding before planning.";
	}

	return {
		originalDump: trimmed,
		microAction,
		durationMinutes: 2,
		suggestedState: "Active",
		rationale,
	};
}

/**
 * Creates a fully valid Task entity in the Active state
 * configured for immediate 2-minute execution.
 */
export function createUnstickTask(brainDump: string): Task {
	const result = extractMicroAction(brainDump);
	const now = new Date();
	const deadline = new Date(now.getTime() + result.durationMinutes * 60 * 1000);
	const isoNow = now.toISOString();

	return {
		id: crypto.randomUUID(),
		title: result.microAction,
		state: TASK_STATE.Active,
		smart: {
			specific: {
				response: result.microAction,
				met: true,
			},
			timeBound: {
				response: `Complete within ${result.durationMinutes} minutes`,
				deadline,
				met: true,
			},
		},
		subgoalIds: [],
		parentId: null,
		prerequisites: [],
		reviewNotes: null,
		createdAt: isoNow,
		updatedAt: isoNow,
	};
}
