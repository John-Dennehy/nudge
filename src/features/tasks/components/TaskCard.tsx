import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { TASK_STATE, type Task } from "@/core/types/task";
import { useTransitionTask } from "../hooks/useTasks";

interface TaskCardProps {
  task: Task;
  onDefine?: (task: Task) => void;
}

export function TaskCard({ task, onDefine }: TaskCardProps) {
  const transitionTask = useTransitionTask();

  const handleStartDefining = async () => {
    await transitionTask(task, TASK_STATE.Defined);
  };

  const handleFail = async () => {
    await transitionTask(task, TASK_STATE.Failed);
  };

  const handleSucceed = async () => {
    await transitionTask(task, TASK_STATE.Succeeded);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="py-3">
        <CardTitle className="text-lg font-medium">{task.title}</CardTitle>
      </CardHeader>
      <CardFooter className="py-3 flex gap-2 flex-wrap">
        {task.state === TASK_STATE.Ideas && (
          <Button size="sm" onClick={handleStartDefining}>Flesh it out</Button>
        )}
        
        {task.state === TASK_STATE.Defined && (
          <Button size="sm" onClick={() => onDefine?.(task)}>Set SMART Criteria</Button>
        )}
        
        {task.state === TASK_STATE.Active && (
          <>
            <Button size="sm" variant="default" onClick={handleSucceed}>Complete</Button>
            <Button size="sm" variant="destructive" onClick={handleFail}>Fail</Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
