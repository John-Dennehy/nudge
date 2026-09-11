import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Task, TaskState } from "@/core/types/task";
import { taskRepository } from "../api/repository";
import { transitionTask } from "../utils/transitions";

export function useTasks() {
	return useQuery({
		queryKey: ["tasks"],
		queryFn: () => taskRepository.getTasks(),
	});
}

export function useAddTask() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (title: string) => {
			const newTask: Task = {
				id: crypto.randomUUID(),
				title,
				state: "Ideas",
				smart: {},
				subgoalIds: [],
				parentId: null,
				prerequisites: [],
				reviewNotes: null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
			await taskRepository.saveTask(newTask);
			return newTask;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["tasks"] });
		},
	});
}

export function useUpdateTask() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (task: Task) => {
			return taskRepository.saveTask(task);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["tasks"] });
		},
	});
}

export function useDeleteTask() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (taskId: string) => {
			await taskRepository.deleteTask(taskId);
			return taskId;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["tasks"] });
		},
	});
}

export function useTransitionTask() {
	const updateTask = useUpdateTask();

	return async (task: Task, targetState: TaskState) => {
		const result = transitionTask(task, targetState);
		if (!result.success) {
			throw new Error(result.reason);
		}
		return updateTask.mutateAsync(result.task);
	};
}

export function useAgreedTask() {
	const { data: tasks } = useTasks();
	return tasks?.find((t) => t.state === "Active") || null;
}

export function useQuietProgress() {
	const queryClient = useQueryClient();
	const query = useQuery({
		queryKey: ["quiet-progress"],
		queryFn: () => taskRepository.getQuietProgress(),
	});

	const recordMutation = useMutation({
		mutationFn: async ({
			metric,
			amount = 1,
		}: {
			metric: keyof import("@/core/types/task").QuietProgress;
			amount?: number;
		}) => {
			return taskRepository.recordProgress(metric, amount);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["quiet-progress"] });
		},
	});

	return {
		progress: query.data ?? {
			thoughtsUntangled: 0,
			microStepsCompleted: 0,
			reflectionsCaptured: 0,
			comfortZonesExpanded: 0,
		},
		recordProgress: recordMutation.mutateAsync,
	};
}
