import type { QuietProgress, Task } from "@/core/types/task";

export interface TaskRepository {
	getTasks(): Promise<Task[]>;
	getTaskById(id: string): Promise<Task | null>;
	saveTask(task: Task): Promise<Task>;
	deleteTask(id: string): Promise<void>;
	getQuietProgress(): Promise<QuietProgress>;
	recordProgress(
		metric: keyof QuietProgress,
		amount?: number,
	): Promise<QuietProgress>;
}

const STORAGE_KEY = "nudge_tasks_v1";
const PROGRESS_KEY = "nudge_quiet_progress_v1";

const DEFAULT_PROGRESS: QuietProgress = {
	thoughtsUntangled: 0,
	microStepsCompleted: 0,
	reflectionsCaptured: 0,
	comfortZonesExpanded: 0,
};

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

export function getStoredProgress(): QuietProgress {
	try {
		const data = localStorage.getItem(PROGRESS_KEY);
		return data
			? { ...DEFAULT_PROGRESS, ...JSON.parse(data) }
			: DEFAULT_PROGRESS;
	} catch {
		return DEFAULT_PROGRESS;
	}
}

export function storeProgress(progress: QuietProgress): void {
	try {
		localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
	} catch {}
}

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
	},

	async getQuietProgress(): Promise<QuietProgress> {
		return getStoredProgress();
	},

	async recordProgress(
		metric: keyof QuietProgress,
		amount = 1,
	): Promise<QuietProgress> {
		const current = getStoredProgress();
		current[metric] = (current[metric] || 0) + amount;
		storeProgress(current);
		return current;
	},
};
