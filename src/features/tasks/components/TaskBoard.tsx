import { useState } from "react";
import { useTasks, useAddTask } from "../hooks/useTasks";
import { TASK_STATE, type Task } from "@/core/types/task";
import { TaskCard } from "./TaskCard";
import { DefineTaskDialog } from "./DefineTaskDialog";
import { ReviewTaskDialog } from "./ReviewTaskDialog";
import { prioritiseTasks } from "../api/prioritiseTasks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

type Tab = "active" | "archive";

export function TaskBoard() {
  const { data: tasks, isLoading } = useTasks();
  const addTask = useAddTask();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [taskToDefine, setTaskToDefine] = useState<Task | null>(null);
  const [taskToReview, setTaskToReview] = useState<Task | null>(null);
  const [currentTab, setCurrentTab] = useState<Tab>("active");
  const [isPrioritising, setIsPrioritising] = useState(false);
  const [suggestedTaskId, setSuggestedTaskId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="p-8 text-center animate-pulse">Loading Nudge...</div>;
  }

  const ideas = tasks?.filter((t) => t.state === TASK_STATE.Ideas) || [];
  const defined = tasks?.filter((t) => t.state === TASK_STATE.Defined) || [];
  const active = tasks?.filter((t) => t.state === TASK_STATE.Active) || [];
  
  const archives = tasks?.filter((t) => [TASK_STATE.Succeeded, TASK_STATE.Failed, TASK_STATE.Reviewed].includes(t.state as any)) || [];
  const needsReviewCount = archives.filter((t) => t.state !== TASK_STATE.Reviewed).length;

  const checkIsBlocked = (task: Task) => {
    if (!task.prerequisites || task.prerequisites.length === 0) return false;
    return task.prerequisites.some((pre) => {
      const parentTask = tasks?.find(t => t.id === pre.taskId);
      return !parentTask || parentTask.state !== TASK_STATE.Succeeded;
    });
  };

  const handleAddIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await addTask.mutateAsync(newTaskTitle);
    setNewTaskTitle("");
  };

  const handleSuggestNext = async () => {
    if (defined.length < 2) return;
    try {
      setIsPrioritising(true);
      setSuggestedTaskId(null);
      // @ts-expect-error - TanStack types
      const id = await prioritiseTasks({ data: { tasks: defined } });
      if (id) setSuggestedTaskId(id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPrioritising(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        {/* Add Idea Bar */}
        <form onSubmit={handleAddIdea} className="flex gap-2 w-full max-w-xl">
        <Input 
          placeholder="Capture an idea or vague goal..." 
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="flex-1"
        />
          <Button type="submit" disabled={addTask.isPending}>Capture</Button>
        </form>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${currentTab === 'active' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
            onClick={() => setCurrentTab("active")}
          >
            Kanban Board
          </button>
          <button 
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${currentTab === 'archive' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
            onClick={() => setCurrentTab("archive")}
          >
            Past Efforts {needsReviewCount > 0 && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{needsReviewCount}</span>}
          </button>
        </div>
      </div>

      {currentTab === 'active' ? (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start animate-in fade-in zoom-in-95 duration-200">
        {/* Board Columns */}
        {/* IDEAS COLUMN */}
        <div className="bg-slate-50/50 p-4 rounded-xl border">
          <h2 className="font-semibold text-lg mb-4 flex justify-between">
            💡 Sandbox Ideas
            <span className="text-muted-foreground text-sm font-normal">{ideas.length}</span>
          </h2>
          <div className="space-y-4">
            {ideas.map((task) => (
              <TaskCard key={task.id} task={task} onDefine={setTaskToDefine} isBlocked={checkIsBlocked(task)} />
            ))}
            {ideas.length === 0 && (
              <p className="text-sm text-center text-muted-foreground py-4">No ideas captured. Let your mind wander.</p>
            )}
          </div>
        </div>

        {/* DEFINED COLUMN */}
        <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100 relative">
          <h2 className="font-semibold text-lg mb-4 flex justify-between items-center">
            📋 Defined Tasks
            {defined.length > 1 && (
              <Button size="sm" variant="outline" className="text-xs h-7 ml-2 text-indigo-700 border-indigo-200 hover:bg-indigo-50" onClick={handleSuggestNext} disabled={isPrioritising}>
                 {isPrioritising ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                 Suggest Next
              </Button>
            )}
            <span className="text-muted-foreground text-sm font-normal ml-auto">{defined.length}</span>
          </h2>
          <div className="space-y-4">
            {defined.map((task) => (
              <div key={task.id} className={task.id === suggestedTaskId ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl animate-in fade-in duration-500' : ''}>
                {task.id === suggestedTaskId && <div className="text-xs font-bold text-indigo-600 mb-1 ml-1 tracking-wide flex items-center gap-1"><Sparkles className="h-3 w-3" />RECOMMENDED PRIORITY</div>}
                <TaskCard task={task} onDefine={setTaskToDefine} isBlocked={checkIsBlocked(task)} />
              </div>
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
              <TaskCard key={task.id} task={task} onDefine={setTaskToDefine} isBlocked={checkIsBlocked(task)} />
            ))}
             {active.length === 0 && (
              <p className="text-sm text-center text-muted-foreground py-4">No active tasks. Good time to chill or define a new one!</p>
            )}
          </div>
        </div>
      </div>
      ) : (
      <div className="w-full max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Archives / Past Efforts View */}
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
          📚 Archive & Review 
        </h2>
        {archives.length === 0 ? (
          <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-dashed text-slate-500">
            You haven't completed or failed any tasks yet. Keep pushing forward!
          </div>
        ) : (
          <div className="space-y-4">
            {archives.map((task) => (
              <TaskCard key={task.id} task={task} onReview={setTaskToReview} isBlocked={checkIsBlocked(task)} />
            ))}
          </div>
        )}
      </div>
      )}

      <DefineTaskDialog 
        task={taskToDefine} 
        isOpen={!!taskToDefine} 
        onClose={() => setTaskToDefine(null)} 
      />
      
      <ReviewTaskDialog
        task={taskToReview}
        isOpen={!!taskToReview}
        onClose={() => setTaskToReview(null)}
      />
    </div>
  );
}
