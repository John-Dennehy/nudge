import { describe, expect, it } from "vitest";
import type { Task } from "@/core/types/task";
import { TASK_STATE } from "@/core/types/task";
import { selectAdaptiveNudges } from "../nudges";

function createMockTask(overrides: Partial<Task>): Task {
	return {
		id: crypto.randomUUID(),
		title: "Mock task",
		state: TASK_STATE.Defined,
		smart: {},
		subgoalIds: [],
		parentId: null,
		prerequisites: [],
		reviewNotes: null,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		...overrides,
	};
}

describe("selectAdaptiveNudges", () => {
	it("returns an empty array when there are no candidate tasks", () => {
		expect(selectAdaptiveNudges([])).toEqual([]);
	});

	it("ignores tasks that are already Active, Succeeded, or Reviewed", () => {
		const tasks = [
			createMockTask({ state: TASK_STATE.Active }),
			createMockTask({ state: TASK_STATE.Succeeded }),
			createMockTask({ state: TASK_STATE.Reviewed }),
		];
		expect(selectAdaptiveNudges(tasks)).toEqual([]);
	});

	it("surfaces a Momentum Quick Win for low-activation tasks", () => {
		const task = createMockTask({
			title: "Open the project folder",
			state: TASK_STATE.Defined,
		});
		const nudges = selectAdaptiveNudges([task]);
		expect(nudges.length).toBe(1);
		expect(nudges[0].archetype).toBe("momentum");
		expect(nudges[0].label).toBe("Quick Win");
	});

	it("surfaces Urgent Slice when a task has a deadline within 48 hours", () => {
		const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
		const urgentTask = createMockTask({
			title: "Submit invoice",
			smart: {
				timeBound: {
					response: "Tomorrow",
					deadline: tomorrow,
					met: true,
				},
			},
		});
		const regularTask = createMockTask({ title: "Reorganize bookshelf" });

		const nudges = selectAdaptiveNudges([urgentTask, regularTask]);
		expect(nudges.some((n) => n.archetype === "urgent_slice")).toBe(true);
		const urgentNudge = nudges.find((n) => n.archetype === "urgent_slice");
		expect(urgentNudge?.label).toBe("Needs Attention Soon");
	});

	it("does not duplicate tasks across multiple nudge categories", () => {
		const task1 = createMockTask({
			title: "Open doc",
			createdAt: "2026-01-01T00:00:00Z",
		});
		const task2 = createMockTask({
			title: "Clean room",
			createdAt: "2026-01-02T00:00:00Z",
		});
		const nudges = selectAdaptiveNudges([task1, task2]);
		const ids = nudges.map((n) => n.task.id);
		const uniqueIds = new Set(ids);
		expect(ids.length).toBe(uniqueIds.size);
	});
});
