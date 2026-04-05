import type { Task, TaskState } from "@/core/types/task";
import { ALLOWED_TRANSITIONS } from "@/core/types/task";

type TransitionSuccess = {
  success: true;
  task: Task;
  reason: null;
};

type TransitionFailure = {
  success: false;
  task: Task;
  reason: string;
};

type TransitionTask = TransitionSuccess | TransitionFailure;

function transitionTask(task: Task, targetState: TaskState): TransitionTask {
  if (!ALLOWED_TRANSITIONS[task.state].includes(targetState)) {
    return { success: false, task, reason: "Invalid transition" };
  }
  return {
    success: true,
    task: { ...task, state: targetState, updatedAt: new Date().toISOString() },
    reason: null,
  };
}

export { transitionTask };
