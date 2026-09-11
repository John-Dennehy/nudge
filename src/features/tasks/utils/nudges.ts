import type { AdaptiveNudge, Task } from "@/core/types/task";
import { TASK_STATE } from "@/core/types/task";

/**
 * Curates a small, adaptive set of contextual task options for the user.
 * Avoids rigid 3-task limits, instead surfacing the most fitting archetypes
 * based on momentum, dread-clearing, leverage, and urgent deadlines.
 *
 * All user-facing copy adheres to the Plain English Rule (zero jargon).
 */
export function selectAdaptiveNudges(tasks: Task[]): AdaptiveNudge[] {
	// Only consider actionable tasks (Defined or Ideas) that are not already Active, Succeeded, or Reviewed
	const candidates = tasks.filter(
		(t) => t.state === TASK_STATE.Defined || t.state === TASK_STATE.Ideas,
	);

	if (candidates.length === 0) {
		return [];
	}

	const nudges: AdaptiveNudge[] = [];
	const pickedIds = new Set<string>();

	// 1. Urgent Slice: Check if any task has an imminent deadline
	const now = new Date();
	const urgentTask = candidates.find((t) => {
		if (pickedIds.has(t.id)) return false;
		const deadline = t.smart.timeBound?.deadline;
		if (!deadline) return false;
		const hoursRemaining =
			(new Date(deadline).getTime() - now.getTime()) / (1000 * 60 * 60);
		return hoursRemaining > 0 && hoursRemaining <= 48;
	});

	if (urgentTask) {
		pickedIds.add(urgentTask.id);
		nudges.push({
			task: urgentTask,
			archetype: "urgent_slice",
			label: "Needs Attention Soon",
			reason: "Has an approaching target date. Let's make an immediate start.",
			estimatedMinutes: 5,
		});
	}

	// 2. Momentum Builder ("One Fork"): A small, low-effort task to break inertia
	// Tasks with shorter titles, low subgoals, or explicit starter wording
	const momentumTask =
		candidates.find((t) => {
			if (pickedIds.has(t.id)) return false;
			const text = t.title.toLowerCase();
			return (
				text.startsWith("open ") ||
				text.startsWith("read ") ||
				text.startsWith("check ") ||
				text.startsWith("find ") ||
				text.startsWith("write ") ||
				t.title.length < 35
			);
		}) || candidates.find((t) => !pickedIds.has(t.id));

	if (momentumTask) {
		pickedIds.add(momentumTask.id);
		nudges.push({
			task: momentumTask,
			archetype: "momentum",
			label: "Quick Win",
			reason:
				"Low activation effort. Great for building quick physical momentum.",
			estimatedMinutes: 2,
		});
	}

	// 3. Dread Clearer ("Eat the Frog"): Lingering task or one with emotional resistance
	// Identified by older creation date or heavier scope
	const dreadTask = [...candidates]
		.sort(
			(a, b) =>
				new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
		)
		.find((t) => !pickedIds.has(t.id));

	if (dreadTask) {
		pickedIds.add(dreadTask.id);
		nudges.push({
			task: dreadTask,
			archetype: "dread",
			label: "Clear the Dread",
			reason:
				"Tackle something that's been lingering to relieve background mental weight.",
			estimatedMinutes: 15,
		});
	}

	// 4. High Leverage ("Bang for Buck"): Best balance of impact to effort
	const leverageTask = candidates.find((t) => !pickedIds.has(t.id));
	if (leverageTask) {
		pickedIds.add(leverageTask.id);
		nudges.push({
			task: leverageTask,
			archetype: "leverage",
			label: "Best Return",
			reason: "High meaningful progress for a manageable amount of energy.",
			estimatedMinutes: 10,
		});
	}

	return nudges;
}
