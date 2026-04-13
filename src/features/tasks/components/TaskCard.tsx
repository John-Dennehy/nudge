import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { TASK_STATE, type Task } from "@/core/types/task";
import { useTransitionTask } from "../hooks/useTasks";

interface TaskCardProps {
  task: Task;
  onDefine?: (task: Task) => void;
  onReview?: (task: Task) => void;
  isBlocked?: boolean;
}

export function TaskCard({ task, onDefine, onReview, isBlocked = false }: TaskCardProps) {
  const transitionTask = useTransitionTask();

  const handleActivate = async () => {
    await transitionTask(task, TASK_STATE.Active);
  };
  
  const handleDemote = async () => {
    await transitionTask(task, TASK_STATE.Defined);
  };

  const handleFail = async () => {
    if (window.confirm("You are marking this task as Failed. It will be moved to Past Efforts for review. Are you sure?")) {
      await transitionTask(task, TASK_STATE.Failed);
    }
  };

  const handleSucceed = async () => {
    if (window.confirm("Boom! You did it! Mark this task as Succeeded and move it to Past Efforts for a quick review?")) {
      await transitionTask(task, TASK_STATE.Succeeded);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="py-3 pb-1">
        <CardTitle className="text-lg font-medium">{task.title}</CardTitle>
        <div className="flex gap-2 text-xs font-medium mt-1">
          {task.smart?.timeBound?.deadline && (
            <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-100">
              Due: {new Date(task.smart.timeBound.deadline).toLocaleDateString()}
            </span>
          )}
          {isBlocked && (
            <span className="bg-orange-600 text-white font-bold px-2 py-0.5 rounded-full shadow-sm">
              BLOCKED
            </span>
          )}
          {task.prerequisites?.length > 0 && !isBlocked && (
            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
              {task.prerequisites.length} Dependencies (Cleared)
            </span>
          )}
        </div>
      </CardHeader>
      <CardFooter className="py-3 flex gap-2 flex-wrap">
        {task.state === TASK_STATE.Ideas && (
          <Button size="sm" onClick={() => onDefine?.(task)}>Flesh it out</Button>
        )}
        
        {task.state === TASK_STATE.Defined && (
          <>
            <Button size="sm" variant="default" className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50" onClick={handleActivate} disabled={isBlocked}>Activate</Button>
            <Button size="sm" variant="outline" onClick={() => onDefine?.(task)}>Refine / Edit</Button>
          </>
        )}
        
        {task.state === TASK_STATE.Active && (
          <>
            <Button size="sm" variant="default" onClick={handleSucceed}>Complete</Button>
            <Button size="sm" variant="destructive" onClick={handleFail}>Fail</Button>
            <Button size="sm" variant="outline" onClick={handleDemote}>Demote to Backlog</Button>
          </>
        )}
        
        {[TASK_STATE.Succeeded, TASK_STATE.Failed, TASK_STATE.Reviewed].includes(task.state as any) && (
          <>
            {task.state !== TASK_STATE.Reviewed && (
              <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => onReview?.(task)}>
                Review Effort
              </Button>
            )}
            <Button size="sm" variant="outline" className="text-slate-500" onClick={handleDemote}>Restore to Backlog</Button>
          </>
        )}
      </CardFooter>
      {task.state === TASK_STATE.Reviewed && task.reviewNotes && (
        <div className="px-6 pb-4 pt-0 text-sm">
          <div className="bg-slate-50 border rounded-md p-3 space-y-2">
            <div>
              <span className="font-semibold text-slate-700">Lesson:</span> 
              <p className="text-slate-600 mt-0.5">{task.reviewNotes.lesson}</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
