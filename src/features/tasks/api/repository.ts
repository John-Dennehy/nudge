import type { Task } from "@/core/types/task";

export interface TaskRepository {
  getTasks(): Promise<Task[]>;
  getTaskById(id: string): Promise<Task | null>;
  saveTask(task: Task): Promise<Task>;
  deleteTask(id: string): Promise<void>;
}

const STORAGE_KEY = "nudge_tasks_v1";

// Helper functions for storage abstraction
function getStoredTasks(): Task[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function storeTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Procedural object that satisfies the TaskRepository interface
export const taskRepository: TaskRepository = {
  async getTasks(): Promise<Task[]> {
    return getStoredTasks();
  },

  async getTaskById(id: string): Promise<Task | null> {
    const tasks = getStoredTasks();
    return tasks.find((t) => t.id === id) || null;
  },

  async saveTask(task: Task): Promise<Task> {
    const tasks = getStoredTasks();
    const existingIndex = tasks.findIndex((t) => t.id === task.id);
    
    if (existingIndex >= 0) {
      tasks[existingIndex] = task;
    } else {
      tasks.push(task);
    }
    
    storeTasks(tasks);
    return task;
  },

  async deleteTask(id: string): Promise<void> {
    const tasks = getStoredTasks();
    storeTasks(tasks.filter((t) => t.id !== id));
  }
};
