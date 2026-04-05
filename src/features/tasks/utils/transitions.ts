import {
  ALLOWED_TRANSITIONS,
  type Task,
  type TaskState,
} from "@/core/types/task";

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
  return {
    success: true,
    task: { ...task, state: targetState, updatedAt: new Date().toISOString() },
  } satisfies TransitionResult;
}

export { transitionTask };
