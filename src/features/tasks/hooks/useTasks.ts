import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { taskRepository } from "../api/repository";
import type { Task, TaskState } from "@/core/types/task";
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
      return taskRepository.saveTask(newTask);
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
