import {
  ALLOWED_TRANSITIONS,
  TASK_STATE,
  type Task,
  type TaskState,
} from "@/core/types/task";
import { isSmartComplete } from "./smartCriteria";

type TransitionSuccess = {
  success: true;
  task: Task;
};

type TransitionFailure = {
  success: false;
  reason: string;
};

export type TransitionResult = TransitionSuccess | TransitionFailure;

function transitionTask(task: Task, targetState: TaskState) {
  if (!ALLOWED_TRANSITIONS[task.state].includes(targetState)) {
    return {
      success: false,
      reason: `Cannot move a task from ${task.state} to ${targetState}`,
    } satisfies TransitionResult;
  }
  if (targetState === TASK_STATE.Active && !isSmartComplete(task)) {
    return {
      success: false,
      reason: "Cannot move a task to Active until all SMART criteria are met",
    } satisfies TransitionResult;
  }

  return {
    success: true,
    task: { ...task, state: targetState, updatedAt: new Date().toISOString() },
  } satisfies TransitionResult;
}

export { transitionTask };
