import { describe, expect, it } from "vitest";

import { TASK_STATE, type Task } from "@/core/types/task";
import { transitionTask } from "../transitions";

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

// ─── Valid Transitions ────────────────────────────────────────────────────────

describe("transitionTask — valid transitions", () => {
  it("transitions a task from Ideas to Defined", () => {
    const task = makeTask({ state: TASK_STATE.Ideas });
    const result = transitionTask(task, TASK_STATE.Defined);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.task.state).toBe(TASK_STATE.Defined);
    }
  });

  it("transitions a task from Defined to Active", () => {
    const task = makeTask({ state: TASK_STATE.Defined });
    const result = transitionTask(task, TASK_STATE.Active);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.task.state).toBe(TASK_STATE.Active);
    }
  });

  it("transitions a task from Defined back to Ideas", () => {
    const task = makeTask({ state: TASK_STATE.Defined });
    const result = transitionTask(task, TASK_STATE.Ideas);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.task.state).toBe(TASK_STATE.Ideas);
    }
  });

  it("transitions a task from Active to Paused", () => {
    const task = makeTask({ state: TASK_STATE.Active });
    const result = transitionTask(task, TASK_STATE.Paused);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.task.state).toBe(TASK_STATE.Paused);
    }
  });

  it("transitions a task from Active to Succeeded", () => {
    const task = makeTask({ state: TASK_STATE.Active });
    const result = transitionTask(task, TASK_STATE.Succeeded);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.task.state).toBe(TASK_STATE.Succeeded);
    }
  });

  it("transitions a task from Active to Failed", () => {
    const task = makeTask({ state: TASK_STATE.Active });
    const result = transitionTask(task, TASK_STATE.Failed);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.task.state).toBe(TASK_STATE.Failed);
    }
  });

  it("transitions a task from Paused back to Active", () => {
    const task = makeTask({ state: TASK_STATE.Paused });
    const result = transitionTask(task, TASK_STATE.Active);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.task.state).toBe(TASK_STATE.Active);
    }
  });

  it("transitions a task from Paused to Failed", () => {
    const task = makeTask({ state: TASK_STATE.Paused });
    const result = transitionTask(task, TASK_STATE.Failed);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.task.state).toBe(TASK_STATE.Failed);
    }
  });

  it("transitions a task from Succeeded to Reviewed", () => {
    const task = makeTask({ state: TASK_STATE.Succeeded });
    const result = transitionTask(task, TASK_STATE.Reviewed);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.task.state).toBe(TASK_STATE.Reviewed);
    }
  });

  it("transitions a task from Failed to Reviewed", () => {
    const task = makeTask({ state: TASK_STATE.Failed });
    const result = transitionTask(task, TASK_STATE.Reviewed);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.task.state).toBe(TASK_STATE.Reviewed);
    }
  });
});

// ─── Updated Timestamp ────────────────────────────────────────────────────────

describe("transitionTask — updatedAt", () => {
  it("sets updatedAt to a new timestamp after a valid transition", () => {
    const task = makeTask({
      state: TASK_STATE.Ideas,
      updatedAt: "2025-07-21T09:00:00.000Z",
    });
    const result = transitionTask(task, TASK_STATE.Defined);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.task.updatedAt).not.toBe("2025-07-21T09:00:00.000Z");
    }
  });

  it("does not mutate the original task", () => {
    const task = makeTask({ state: TASK_STATE.Ideas });
    const originalState = task.state;
    const originalUpdatedAt = task.updatedAt;

    transitionTask(task, TASK_STATE.Defined);

    expect(task.state).toBe(originalState);
    expect(task.updatedAt).toBe(originalUpdatedAt);
  });
});

// ─── Invalid Transitions ──────────────────────────────────────────────────────

describe("transitionTask — invalid transitions", () => {
  it("returns success false when transitioning from Ideas to Active (skipping Defined)", () => {
    const task = makeTask({ state: TASK_STATE.Ideas });
    const result = transitionTask(task, TASK_STATE.Active);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBeTruthy();
    }
  });

  it("returns success false when transitioning from Ideas to Reviewed", () => {
    const task = makeTask({ state: TASK_STATE.Ideas });
    const result = transitionTask(task, TASK_STATE.Reviewed);

    expect(result.success).toBe(false);
  });

  it("returns success false when transitioning from Active to Ideas", () => {
    const task = makeTask({ state: TASK_STATE.Active });
    const result = transitionTask(task, TASK_STATE.Ideas);

    expect(result.success).toBe(false);
  });

  it("returns success false when transitioning from Reviewed to any state", () => {
    const task = makeTask({ state: TASK_STATE.Reviewed });
    const result = transitionTask(task, TASK_STATE.Ideas);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBeTruthy();
    }
  });

  it("returns success false when transitioning from Succeeded to Active", () => {
    const task = makeTask({ state: TASK_STATE.Succeeded });
    const result = transitionTask(task, TASK_STATE.Active);

    expect(result.success).toBe(false);
  });

  it("returns a human-readable reason when the transition is not allowed", () => {
    const task = makeTask({ state: TASK_STATE.Reviewed });
    const result = transitionTask(task, TASK_STATE.Active);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(typeof result.reason).toBe("string");
      expect(result.reason.length).toBeGreaterThan(0);
    }
  });

  it("does not mutate the original task on a failed transition", () => {
    const task = makeTask({ state: TASK_STATE.Reviewed });
    const originalState = task.state;

    transitionTask(task, TASK_STATE.Active);

    expect(task.state).toBe(originalState);
  });
});
