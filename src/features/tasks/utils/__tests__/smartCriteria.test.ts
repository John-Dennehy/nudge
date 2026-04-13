import { describe, expect, it } from "vitest";

import { TASK_STATE, type Task } from "@/core/types/task";
import {
	isAchievableMet,
	isMeasurableMet,
	isRelevantMet,
	isSmartComplete,
	isSpecificMet,
	isTimeBoundMet,
} from "../smartCriteria";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTask(overrides: Partial<Task> = {}): Task {
	return {
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
		...overrides,
	};
}

// ─── isSpecificMet ────────────────────────────────────────────────────────────

describe("isSpecificMet", () => {
	it("returns true when specific criterion is present and met", () => {
		const task = makeTask({
			smart: { specific: { response: "Write the Q3 budget report", met: true } },
		});

		expect(isSpecificMet(task)).toBe(true);
	});

	it("returns false when specific criterion is present but not met", () => {
		const task = makeTask({
			smart: { specific: { response: "Something vague", met: false } },
		});

		expect(isSpecificMet(task)).toBe(false);
	});

	it("returns false when specific criterion is absent", () => {
		const task = makeTask({ smart: {} });

		expect(isSpecificMet(task)).toBe(false);
	});
});

// ─── isMeasurableMet ──────────────────────────────────────────────────────────

describe("isMeasurableMet", () => {
	it("returns true when measurable criterion is present and met", () => {
		const task = makeTask({
			smart: {
				measurable: { response: "Report is submitted and signed off", met: true },
			},
		});

		expect(isMeasurableMet(task)).toBe(true);
	});

	it("returns false when measurable criterion is present but not met", () => {
		const task = makeTask({
			smart: { measurable: { response: "Not sure how to measure this", met: false } },
		});

		expect(isMeasurableMet(task)).toBe(false);
	});

	it("returns false when measurable criterion is absent", () => {
		const task = makeTask({ smart: {} });

		expect(isMeasurableMet(task)).toBe(false);
	});
});

// ─── isAchievableMet ──────────────────────────────────────────────────────────

describe("isAchievableMet", () => {
	it("returns true when achievable criterion is present and met", () => {
		const task = makeTask({
			smart: {
				achievable: { response: "I have all the data I need", met: true },
			},
		});

		expect(isAchievableMet(task)).toBe(true);
	});

	it("returns false when achievable criterion is present but not met", () => {
		const task = makeTask({
			smart: {
				achievable: { response: "I am waiting on data from finance", met: false },
			},
		});

		expect(isAchievableMet(task)).toBe(false);
	});

	it("returns false when achievable criterion is absent", () => {
		const task = makeTask({ smart: {} });

		expect(isAchievableMet(task)).toBe(false);
	});
});

// ─── isRelevantMet ────────────────────────────────────────────────────────────

describe("isRelevantMet", () => {
	it("returns true when relevant criterion is present and met", () => {
		const task = makeTask({
			smart: {
				relevant: { response: "Required for the board meeting", met: true },
			},
		});

		expect(isRelevantMet(task)).toBe(true);
	});

	it("returns false when relevant criterion is present but not met", () => {
		const task = makeTask({
			smart: {
				relevant: { response: "Not sure why this matters right now", met: false },
			},
		});

		expect(isRelevantMet(task)).toBe(false);
	});

	it("returns false when relevant criterion is absent", () => {
		const task = makeTask({ smart: {} });

		expect(isRelevantMet(task)).toBe(false);
	});
});

// ─── isTimeBoundMet ───────────────────────────────────────────────────────────

describe("isTimeBoundMet", () => {
	it("returns true when timeBound criterion is present, met, and has a valid Date deadline", () => {
		const task = makeTask({
			smart: {
				timeBound: {
					response: "By end of Friday",
					met: true,
					deadline: new Date("2025-07-25T17:00:00"),
				},
			},
		});

		expect(isTimeBoundMet(task)).toBe(true);
	});

	it("returns false when timeBound criterion is present but not met", () => {
		const task = makeTask({
			smart: {
				timeBound: {
					response: "Sometime soon",
					met: false,
					deadline: new Date("2025-07-25T17:00:00"),
				},
			},
		});

		expect(isTimeBoundMet(task)).toBe(false);
	});

	it("returns false when timeBound criterion is met but deadline is not a Date", () => {
		const task = makeTask({
			smart: {
				timeBound: {
					response: "By end of Friday",
					met: true,
					deadline: "2025-07-25" as unknown as Date,
				},
			},
		});

		expect(isTimeBoundMet(task)).toBe(false);
	});

	it("returns false when timeBound criterion is absent", () => {
		const task = makeTask({ smart: {} });

		expect(isTimeBoundMet(task)).toBe(false);
	});
});

// ─── isSmartComplete ──────────────────────────────────────────────────────────

describe("isSmartComplete", () => {
	it("returns true when all five criteria are present and met", () => {
		const task = makeTask({
			smart: {
				specific: { response: "Write the Q3 budget report", met: true },
				measurable: { response: "Report is submitted and signed off", met: true },
				achievable: { response: "I have all the data I need", met: true },
				relevant: { response: "Required for the board meeting", met: true },
				timeBound: {
					response: "By end of Friday",
					met: true,
					deadline: new Date("2025-07-25T17:00:00"),
				},
			},
		});

		expect(isSmartComplete(task)).toBe(true);
	});

	it("returns false when one criterion is missing", () => {
		const task = makeTask({
			smart: {
				specific: { response: "Write the Q3 budget report", met: true },
				measurable: { response: "Report is submitted and signed off", met: true },
				achievable: { response: "I have all the data I need", met: true },
				relevant: { response: "Required for the board meeting", met: true },
				// timeBound is missing
			},
		});

		expect(isSmartComplete(task)).toBe(false);
	});

	it("returns false when one criterion is present but not met", () => {
		const task = makeTask({
			smart: {
				specific: { response: "Write the Q3 budget report", met: true },
				measurable: { response: "Report is submitted and signed off", met: true },
				achievable: { response: "Waiting on data from finance", met: false },
				relevant: { response: "Required for the board meeting", met: true },
				timeBound: {
					response: "By end of Friday",
					met: true,
					deadline: new Date("2025-07-25T17:00:00"),
				},
			},
		});

		expect(isSmartComplete(task)).toBe(false);
	});

	it("returns false when smart criteria are completely empty", () => {
		const task = makeTask({ smart: {} });

		expect(isSmartComplete(task)).toBe(false);
	});

	it("returns false when timeBound is met but deadline is not a valid Date", () => {
		const task = makeTask({
			smart: {
				specific: { response: "Write the Q3 budget report", met: true },
				measurable: { response: "Report is submitted and signed off", met: true },
				achievable: { response: "I have all the data I need", met: true },
				relevant: { response: "Required for the board meeting", met: true },
				timeBound: {
					response: "By end of Friday",
					met: true,
					deadline: "not-a-date" as unknown as Date,
				},
			},
		});

		expect(isSmartComplete(task)).toBe(false);
	});
});
