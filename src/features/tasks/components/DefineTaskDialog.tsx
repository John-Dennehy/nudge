import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { TASK_STATE, type Task } from "@/core/types/task";
import { useTransitionTask } from "../hooks/useTasks";

interface DefineTaskDialogProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DefineTaskDialog({ task, isOpen, onClose }: DefineTaskDialogProps) {
  const transitionTask = useTransitionTask();
  
  const [specific, setSpecific] = useState("");
  const [measurable, setMeasurable] = useState("");
  const [achievable, setAchievable] = useState("");
  const [relevant, setRelevant] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");

  // Sync state if form opens with a task that already has some properties
  useEffect(() => {
    if (task) {
      setSpecific(task.smart?.specific?.response || "");
      setMeasurable(task.smart?.measurable?.response || "");
      setAchievable(task.smart?.achievable?.response || "");
      setRelevant(task.smart?.relevant?.response || "");
      
      const tl = task.smart?.timeBound;
      if (tl?.deadline && tl.deadline instanceof Date && !isNaN(tl.deadline.getTime())) {
         setDeadline(tl.deadline.toISOString().split('T')[0]);
      } else {
         setDeadline("");
      }
      setError("");
    }
  }, [task, isOpen]);

  if (!task) return null;

  const handleSaveAndActivate = async () => {
    try {
      setError("");
      
      if (!deadline) {
        setError("Please provide a target date.");
        return;
      }

      const updatedTask: Task = {
        ...task,
        smart: {
          specific: { response: specific, met: !!specific.trim() },
          measurable: { response: measurable, met: !!measurable.trim() },
          achievable: { response: achievable, met: !!achievable.trim() },
          relevant: { response: relevant, met: !!relevant.trim() },
          timeBound: { 
            response: "User defined", 
            met: true, 
            deadline: new Date(`${deadline}T23:59:59`) 
          }
        }
      };
      
      await transitionTask(updatedTask, TASK_STATE.Active);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to make task Active. Please ensure all fields are meaningfully filled out.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Make it a SMART Task</DialogTitle>
          <DialogDescription>
            Before you can act on '{task.title}', Nudge requires you to define it properly.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-5 py-4">
          <div className="grid gap-2">
            <Label htmlFor="specific">Specific</Label>
            <span className="text-xs text-muted-foreground">What exactly do you need to do?</span>
            <Textarea id="specific" value={specific} onChange={(e) => setSpecific(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="measurable">Measurable</Label>
            <span className="text-xs text-muted-foreground">How will you know when it is done? What does "Done" look like?</span>
            <Textarea id="measurable" value={measurable} onChange={(e) => setMeasurable(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="achievable">Achievable</Label>
            <span className="text-xs text-muted-foreground">What resources or time constraints do you have? Is it realistic?</span>
            <Textarea id="achievable" value={achievable} onChange={(e) => setAchievable(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="relevant">Relevant</Label>
            <span className="text-xs text-muted-foreground">Why does this matter right now?</span>
            <Textarea id="relevant" value={relevant} onChange={(e) => setRelevant(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="deadline">Time-Bound (Target Date)</Label>
            <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} type="button">Close</Button>
          <Button onClick={handleSaveAndActivate} type="button">Make Active</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
