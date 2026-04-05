// Core Task types for Nudge
// All tasks — whether top-level goals or subgoals — share the same shape.
// References to other tasks (subgoals, prerequisites) are stored as IDs,
// with the full task objects living flat in the task store.

// ─── State Machine ────────────────────────────────────────────────────────────

export const TASK_STATE = {
	Ideas: "Ideas",
	Defined: "Defined",
	Active: "Active",
	Paused: "Paused",
	Succeeded: "Succeeded",
	Failed: "Failed",
	Reviewed: "Reviewed",
} as const;

export type TaskState = (typeof TASK_STATE)[keyof typeof TASK_STATE];

// Which states a task is allowed to transition to from a given state.
// Paused → Failed is intentionally omitted here — that transition is
// triggered automatically by the app when the time-bound expires,
// not by user action. See features/tasks/utils/transitions.ts.
export const ALLOWED_TRANSITIONS: Record<TaskState, TaskState[]> = {
	[TASK_STATE.Ideas]: [TASK_STATE.Defined],
	[TASK_STATE.Defined]: [TASK_STATE.Active, TASK_STATE.Ideas],
	[TASK_STATE.Active]: [
		TASK_STATE.Succeeded,
		TASK_STATE.Failed,
		TASK_STATE.Paused,
	],
	[TASK_STATE.Paused]: [TASK_STATE.Active, TASK_STATE.Failed],
	[TASK_STATE.Succeeded]: [TASK_STATE.Reviewed],
	[TASK_STATE.Failed]: [TASK_STATE.Reviewed],
	[TASK_STATE.Reviewed]: [],
};

// ─── SMART Criteria ───────────────────────────────────────────────────────────

// SMART criteria are populated progressively as the app guides the user
// through questions. A task in the Ideas state may have none of these filled.
// By the time a task reaches Active, all fields should be present.

export type SmartCriteria = {
	// Specific: a clear, unambiguous description of what the task involves
	specific: string;

	// Measurable: what does "done" look like? How will the user know?
	measurable: string;

	// Achievable: are there any constraints to account for? (time, energy, resources)
	achievable: string;

	// Relevant: why does this task matter to the user's broader goals?
	relevant: string;

	// Time-bound: the deadline or target date. Used by the app to trigger
	// automatic Paused → Failed transitions when time expires.
	timeBound: Date;
};

// ─── Prerequisite Source ──────────────────────────────────────────────────────

// Tracks whether a prerequisite was added by the user or suggested by the app.
// App-suggested prerequisites require user confirmation before taking effect.
export type PrerequisiteSource = "user" | "suggested";

export type Prerequisite = {
	taskId: string;
	source: PrerequisiteSource;
	confirmed: boolean;
};

// ─── Review Notes ─────────────────────────────────────────────────────────────

// Captured when a task transitions to Reviewed.
// Reframes failure as a lesson — both fields apply regardless of outcome.
export type ReviewNotes = {
	// What happened? (brief user reflection)
	reflection: string;

	// What would the user do differently, or what did they learn?
	lesson: string;
};

// ─── Task ─────────────────────────────────────────────────────────────────────

export type Task = {
	// Unique identifier — used for all cross-references
	id: string;

	// The user's plain-language title for the task
	title: string;

	// Current state in the task state machine
	state: TaskState;

	// SMART criteria — progressively populated by the app
	// Partial because a task in Ideas state may have none of these yet
	smart: Partial<SmartCriteria>;

	// IDs of child tasks (subgoals). These are tasks owned by this task.
	// The full task objects live flat in the task store, looked up by ID.
	subgoalIds: string[];

	// ID of the parent task, if this task is itself a subgoal
	parentId: string | null;

	// Tasks that must be completed before this task can become Active.
	// Includes both user-selected and app-suggested prerequisites.
	prerequisites: Prerequisite[];

	// Notes captured when the task reaches the Reviewed state
	reviewNotes: ReviewNotes | null;

	// ISO timestamp — when the task was first created
	createdAt: string;

	// ISO timestamp — when the task last changed state
	updatedAt: string;
};
