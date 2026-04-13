import type { Task } from "@/core/types/task";

// Specific: a clear, unambiguous description of what the task involves
function isSpecificMet(task: Task) {
  return task.smart.specific?.met === true;
}

// Measurable: the task can be quantified or measured
function isMeasurableMet(task: Task) {
  return task.smart.measurable?.met === true;
}

// Achievable: the task is within the user's current capabilities or resources
function isAchievableMet(task: Task) {
  return task.smart.achievable?.met === true;
}

// Relevant: the task is relevant to the user's current context or goal
function isRelevantMet(task: Task) {
  return task.smart.relevant?.met === true;
}

// Time-bound: the task has a deadline or time limit
function isTimeBoundMet(task: Task) {
  return (
    task.smart.timeBound?.met === true &&
    task.smart.timeBound?.deadline instanceof Date
  );
}

// Smart Complete: all smart criteria are met
function isSmartComplete(task: Task) {
  return (
    isSpecificMet(task) &&
    isMeasurableMet(task) &&
    isAchievableMet(task) &&
    isRelevantMet(task) &&
    isTimeBoundMet(task)
  );
}

export {
  isSmartComplete,
  isSpecificMet,
  isMeasurableMet,
  isAchievableMet,
  isRelevantMet,
  isTimeBoundMet,
};
