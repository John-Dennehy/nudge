import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TASK_STATE, type Task } from "@/core/types/task";
import { useTransitionTask } from "../hooks/useTasks";

interface ReviewTaskDialogProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReviewTaskDialog({ task, isOpen, onClose }: ReviewTaskDialogProps) {
  const transitionTask = useTransitionTask();
  
  const [lesson, setLesson] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (task && isOpen) {
      setLesson(task.reviewNotes?.lesson || "");
      setError("");
    }
  }, [task, isOpen]);

  const handleSave = async () => {
    if (!task) return;
    try {
      setError("");
      
      if (!lesson.trim()) {
        setError("Please add a note on what you learned or what you would do differently.");
        return;
      }

      const updatedTask: Task = {
        ...task,
        reviewNotes: { reflection: "Effort expended and acknowledged.", lesson }
      };
      
      await transitionTask(updatedTask, TASK_STATE.Reviewed);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save review notes.");
    }
  };

  if (!task) return null;

  const isSuccess = task.state === TASK_STATE.Succeeded;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {isSuccess ? "Celebrate & Review" : "Post-Mortem Review"}
          </DialogTitle>
          <DialogDescription>
            {isSuccess 
              ? "You successfully hit your constraints! Reflecting on success is just as important as learning from failure."
              : "Not everything goes to plan. Take a moment to reflect on what happened and what you can learn from this effort."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-5 py-4">
          <div className="grid gap-2">
            <Label htmlFor="lesson" className="text-blue-700 font-medium">What did you learn?</Label>
            <span className="text-xs text-muted-foreground">What would you do differently next time?</span>
            <Textarea 
              id="lesson" 
              value={lesson} 
              onChange={(e) => setLesson(e.target.value)} 
              className="min-h-[150px]"
              placeholder="Record your thoughts here..."
              autoFocus
            />
          </div>
          
          {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
          <Button onClick={handleSave} type="button" className="bg-slate-900 text-white hover:bg-slate-800">Save Learning</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
