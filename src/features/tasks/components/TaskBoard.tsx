import { useState } from "react";
import { useTasks, useAddTask } from "../hooks/useTasks";
import { TASK_STATE, type Task } from "@/core/types/task";
import { TaskCard } from "./TaskCard";
import { DefineTaskDialog } from "./DefineTaskDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TaskBoard() {
  const { data: tasks, isLoading } = useTasks();
  const addTask = useAddTask();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [taskToDefine, setTaskToDefine] = useState<Task | null>(null);

  if (isLoading) {
    return <div className="p-8 text-center animate-pulse">Loading Nudge...</div>;
  }

  const ideas = tasks?.filter((t) => t.state === TASK_STATE.Ideas) || [];
  const defined = tasks?.filter((t) => t.state === TASK_STATE.Defined) || [];
  const active = tasks?.filter((t) => t.state === TASK_STATE.Active) || [];

  const handleAddIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await addTask.mutateAsync(newTaskTitle);
    setNewTaskTitle("");
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Add Idea Bar */}
      <form onSubmit={handleAddIdea} className="flex gap-2 w-full max-w-2xl">
        <Input 
          placeholder="Capture an idea or vague goal..." 
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={addTask.isPending}>Capture</Button>
      </form>

      {/* Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* IDEAS COLUMN */}
        <div className="bg-slate-50/50 p-4 rounded-xl border">
          <h2 className="font-semibold text-lg mb-4 flex justify-between">
            💡 Sandbox Ideas
            <span className="text-muted-foreground text-sm font-normal">{ideas.length}</span>
          </h2>
          <div className="space-y-4">
            {ideas.map((task) => (
              <TaskCard key={task.id} task={task} onDefine={setTaskToDefine} />
            ))}
            {ideas.length === 0 && (
              <p className="text-sm text-center text-muted-foreground py-4">No ideas captured. Let your mind wander.</p>
            )}
          </div>
        </div>

        {/* DEFINED COLUMN */}
        <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100">
          <h2 className="font-semibold text-lg mb-4 flex justify-between">
            📋 Defined Tasks
            <span className="text-muted-foreground text-sm font-normal">{defined.length}</span>
          </h2>
          <div className="space-y-4">
            {defined.map((task) => (
              <TaskCard key={task.id} task={task} onDefine={setTaskToDefine} />
            ))}
            {defined.length === 0 && (
              <p className="text-sm text-center text-muted-foreground py-4">Flesh out an idea to move it here.</p>
            )}
          </div>
        </div>

        {/* ACTIVE COLUMN */}
        <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100">
          <h2 className="font-semibold text-lg mb-4 flex justify-between">
            🔥 Active Tasks
            <span className="text-muted-foreground text-sm font-normal">{active.length}</span>
          </h2>
          <div className="space-y-4">
            {active.map((task) => (
              <TaskCard key={task.id} task={task} onDefine={setTaskToDefine} />
            ))}
             {active.length === 0 && (
              <p className="text-sm text-center text-muted-foreground py-4">No active tasks. Good time to chill or define a new one!</p>
            )}
          </div>
        </div>
      </div>

      <DefineTaskDialog 
        task={taskToDefine} 
        isOpen={!!taskToDefine} 
        onClose={() => setTaskToDefine(null)} 
      />
    </div>
  );
}
