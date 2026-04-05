import { describe, expect, it } from "vitest";

import {
	ALLOWED_TRANSITIONS,
	type SmartCriteria,
	type SmartCriterion,
	TASK_STATE,
	type Task,
} from "../task";

// ─── State Machine Tests ──────────────────────────────────────────────────────

describe("TASK_STATE", () => {
	it("contains all seven expected states", () => {
		expect(Object.values(TASK_STATE)).toEqual([
			"Ideas",
			"Defined",
			"Active",
			"Paused",
			"Succeeded",
			"Failed",
			"Reviewed",
		]);
	});
});

describe("ALLOWED_TRANSITIONS", () => {
	it("allows Ideas to transition only to Defined", () => {
		expect(ALLOWED_TRANSITIONS[TASK_STATE.Ideas]).toEqual([TASK_STATE.Defined]);
	});

	it("allows Defined to transition back to Ideas or forward to Active", () => {
		expect(ALLOWED_TRANSITIONS[TASK_STATE.Defined]).toEqual([
			TASK_STATE.Active,
			TASK_STATE.Ideas,
		]);
	});

	it("allows Active to transition to Succeeded, Failed, or Paused", () => {
		expect(ALLOWED_TRANSITIONS[TASK_STATE.Active]).toEqual([
			TASK_STATE.Succeeded,
			TASK_STATE.Failed,
			TASK_STATE.Paused,
		]);
	});

	it("allows Paused to resume as Active or be marked as Failed", () => {
		expect(ALLOWED_TRANSITIONS[TASK_STATE.Paused]).toEqual([
			TASK_STATE.Active,
			TASK_STATE.Failed,
		]);
	});

	it("allows Succeeded to transition only to Reviewed", () => {
		expect(ALLOWED_TRANSITIONS[TASK_STATE.Succeeded]).toEqual([
			TASK_STATE.Reviewed,
		]);
	});

	it("allows Failed to transition only to Reviewed", () => {
		expect(ALLOWED_TRANSITIONS[TASK_STATE.Failed]).toEqual([
			TASK_STATE.Reviewed,
		]);
	});

	it("allows no transitions out of Reviewed — it is a terminal state", () => {
		expect(ALLOWED_TRANSITIONS[TASK_STATE.Reviewed]).toEqual([]);
	});

	it("does not allow Active to transition directly to Reviewed", () => {
		expect(ALLOWED_TRANSITIONS[TASK_STATE.Active]).not.toContain(
			TASK_STATE.Reviewed,
		);
	});

	it("does not allow Ideas to skip states and jump to Active", () => {
		expect(ALLOWED_TRANSITIONS[TASK_STATE.Ideas]).not.toContain(
			TASK_STATE.Active,
		);
	});

	it("does not allow Reviewed to transition to anything", () => {
		expect(ALLOWED_TRANSITIONS[TASK_STATE.Reviewed]).toHaveLength(0);
	});
});

// ─── SmartCriterion Shape Tests ───────────────────────────────────────────────

describe("SmartCriterion", () => {
	it("accepts a response and a met flag", () => {
		const criterion: SmartCriterion = {
			response: "Write the monthly budget report",
			met: true,
		};

		expect(criterion.response).toBe("Write the monthly budget report");
		expect(criterion.met).toBe(true);
	});

	it("can be unmet when the response is present but not yet confirmed", () => {
		const criterion: SmartCriterion = {
			response: "Something vague",
			met: false,
		};

		expect(criterion.met).toBe(false);
	});
});

// ─── SmartCriteria Shape Tests ────────────────────────────────────────────────

describe("SmartCriteria", () => {
	it("accepts a fully populated set of criteria", () => {
		const smart: SmartCriteria = {
			specific: { response: "Write the Q3 budget report", met: true },
			measurable: { response: "Report is submitted and signed off", met: true },
			achievable: { response: "I have all the data I need", met: true },
			relevant: { response: "Required for the board meeting", met: true },
			timeBound: {
				response: "By end of Friday",
				met: true,
				deadline: new Date("2025-07-25"),
			},
		};

		expect(smart.specific.met).toBe(true);
		expect(smart.timeBound.deadline).toBeInstanceOf(Date);
	});

	it("timeBound holds both a human-readable response and a machine-readable deadline", () => {
		const smart: SmartCriteria = {
			specific: { response: "Finish the report", met: true },
			measurable: { response: "Report is submitted", met: true },
			achievable: { response: "I have time blocked out", met: true },
			relevant: { response: "It is due for the board", met: true },
			timeBound: {
				response: "End of Friday",
				met: true,
				deadline: new Date("2025-07-25T17:00:00"),
			},
		};

		expect(smart.timeBound.response).toBe("End of Friday");
		expect(smart.timeBound.deadline.toISOString()).toContain("2025-07-25");
	});
});

// ─── Task Shape Tests ─────────────────────────────────────────────────────────

describe("Task", () => {
	it("accepts a minimal task in the Ideas state with no SMART criteria yet", () => {
		const task: Task = {
			id: "task-001",
			title: "Write the budget report",
			state: TASK_STATE.Ideas,
			smart: {},
			subgoalIds: [],
			parentId: null,
			prerequisites: [],
			reviewNotes: null,
			createdAt: "2025-07-21T09:00:00.000Z",
			updatedAt: "2025-07-21T09:00:00.000Z",
		};

		expect(task.state).toBe("Ideas");
		expect(task.smart).toEqual({});
		expect(task.subgoalIds).toHaveLength(0);
		expect(task.parentId).toBeNull();
		expect(task.reviewNotes).toBeNull();
	});

	it("accepts a task with partial SMART criteria as it is being defined", () => {
		const task: Task = {
			id: "task-002",
			title: "Write the budget report",
			state: TASK_STATE.Defined,
			smart: {
				specific: { response: "Write the Q3 budget report", met: true },
			},
			subgoalIds: [],
			parentId: null,
			prerequisites: [],
			reviewNotes: null,
			createdAt: "2025-07-21T09:00:00.000Z",
			updatedAt: "2025-07-21T10:00:00.000Z",
		};

		expect(task.smart.specific?.met).toBe(true);
		expect(task.smart.measurable).toBeUndefined();
	});

	it("accepts a task with a subgoal relationship via IDs", () => {
		const parentTask: Task = {
			id: "task-003",
			title: "Prepare for board meeting",
			state: TASK_STATE.Active,
			smart: {},
			subgoalIds: ["task-004"],
			parentId: null,
			prerequisites: [],
			reviewNotes: null,
			createdAt: "2025-07-21T09:00:00.000Z",
			updatedAt: "2025-07-21T09:00:00.000Z",
		};

		const subgoalTask: Task = {
			id: "task-004",
			title: "Write the budget report",
			state: TASK_STATE.Active,
			smart: {},
			subgoalIds: [],
			parentId: "task-003",
			prerequisites: [],
			reviewNotes: null,
			createdAt: "2025-07-21T09:00:00.000Z",
			updatedAt: "2025-07-21T09:00:00.000Z",
		};

		expect(parentTask.subgoalIds).toContain(subgoalTask.id);
		expect(subgoalTask.parentId).toBe(parentTask.id);
	});

	it("accepts a task with a user-selected prerequisite", () => {
		const task: Task = {
			id: "task-005",
			title: "Write the budget report",
			state: TASK_STATE.Defined,
			smart: {},
			subgoalIds: [],
			parentId: null,
			prerequisites: [
				{
					taskId: "task-006",
					source: "user",
					confirmed: true,
				},
			],
			reviewNotes: null,
			createdAt: "2025-07-21T09:00:00.000Z",
			updatedAt: "2025-07-21T09:00:00.000Z",
		};

		expect(task.prerequisites[0]?.source).toBe("user");
		expect(task.prerequisites[0]?.confirmed).toBe(true);
	});

	it("accepts a task with an app-suggested prerequisite awaiting confirmation", () => {
		const task: Task = {
			id: "task-007",
			title: "Write the budget report",
			state: TASK_STATE.Defined,
			smart: {},
			subgoalIds: [],
			parentId: null,
			prerequisites: [
				{
					taskId: "task-008",
					source: "suggested",
					confirmed: false,
				},
			],
			reviewNotes: null,
			createdAt: "2025-07-21T09:00:00.000Z",
			updatedAt: "2025-07-21T09:00:00.000Z",
		};

		expect(task.prerequisites[0]?.source).toBe("suggested");
		expect(task.prerequisites[0]?.confirmed).toBe(false);
	});

	it("accepts a Reviewed task with review notes capturing the lesson", () => {
		const task: Task = {
			id: "task-009",
			title: "Write the budget report",
			state: TASK_STATE.Reviewed,
			smart: {},
			subgoalIds: [],
			parentId: null,
			prerequisites: [],
			reviewNotes: {
				reflection: "I left it too late and ran out of time.",
				lesson:
					"I need to break this into smaller steps and start earlier next time.",
			},
			createdAt: "2025-07-21T09:00:00.000Z",
			updatedAt: "2025-07-22T16:00:00.000Z",
		};

		expect(task.reviewNotes).not.toBeNull();
		expect(task.reviewNotes?.lesson).toContain("smaller steps");
	});
});
