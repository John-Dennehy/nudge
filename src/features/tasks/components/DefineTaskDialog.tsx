import { useState, useEffect } from "react";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { TASK_STATE, type Task } from "@/core/types/task";
import { useTransitionTask } from "../hooks/useTasks";
import { generateSmartCriteria, type SmartAssessment } from "../api/generateSmartCriteria";

interface DefineTaskDialogProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DefineTaskDialog({ task, isOpen, onClose }: DefineTaskDialogProps) {
  const transitionTask = useTransitionTask();
  
  const [assessment, setAssessment] = useState<SmartAssessment | null>(null);
  const [contextAnswers, setContextAnswers] = useState<{question: string, answer: string}[]>([]);
  const [overrides, setOverrides] = useState<string[]>([]);
  
  // Questioning state
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Trigger evaluation immediately when dialog opens
  useEffect(() => {
    if (task && isOpen) {
      setAssessment(null);
      setContextAnswers([]);
      setOverrides([]);
      setCurrentAnswer("");
      setError("");
      
      evaluateTask(task.title, [], []);
    }
  }, [task, isOpen]);

  const evaluateTask = async (title: string, context: {question: string, answer: string}[], currentOverrides: string[]) => {
    try {
      setIsGenerating(true);
      setError("");
      // @ts-expect-error - overriding TanStack inference
      const generated = await generateSmartCriteria({ data: { title, contextAnswers: context, overrides: currentOverrides } });
      if (generated) {
        setAssessment(generated);
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message || "Failed to analyze task.");
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContextSubmit = async (question: string, answerOverride?: string) => {
    const finalAnswer = answerOverride !== undefined ? answerOverride : currentAnswer;
    
    if (!finalAnswer.trim() && !assessment?.timeBound.requiresDate) {
      setError("Please provide an answer to continue.");
      return;
    }
    
    if (!task) return;
    
    const newContext = [...contextAnswers, { question, answer: finalAnswer }];
    
    // Await API response before clearing textbox to ensure we don't lose user data on Quota errors.
    const success = await evaluateTask(task.title, newContext, overrides);
    
    if (success) {
      setContextAnswers(newContext);
      setCurrentAnswer("");
    }
  };
  
  const handleOverride = (key: string) => {
    if (!task || !assessment) return;
    
    // Save quota! We don't need to ping the AI just to say 'Skip' -> Locally mutate state to Complete
    const updatedAssessment = { ...assessment };
    (updatedAssessment as any)[key] = { 
      ...((updatedAssessment as any)[key]), 
      met: true, 
      statement: "User explicitly confirmed." 
    };
    
    updatedAssessment.isComplete = 
      updatedAssessment.specific.met && 
      updatedAssessment.measurable.met && 
      updatedAssessment.achievable.met && 
      updatedAssessment.relevant.met && 
      updatedAssessment.timeBound.met;
      
    setAssessment(updatedAssessment);
    
    // Still store overrides in case a future API call is required by another field's context update
    const newOverrides = [...overrides, key];
    setOverrides(newOverrides);
    setCurrentAnswer("");
  };

  const handleDateQuickSelect = async (question: string, offsetDays: number) => {
    if (!task) return;
    
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    const dateStr = target.toISOString().split('T')[0];
    
    const newContext = [...contextAnswers, { question, answer: `Target date: ${dateStr}` }];
    const success = await evaluateTask(task.title, newContext, overrides);
    if (success) {
      setContextAnswers(newContext);
      setCurrentAnswer("");
    }
  };

  const handleSaveAndActivate = async () => {
    if (!task || !assessment) return;
    try {
      setError("");
      
      let deadline = new Date();
      if (assessment.timeBound.statement) {
         // Attempt to parse out a date if the AI included one in the context (often not guaranteed without robust NLP).
         // For a seamless MVP flow, if it's evaluated as complete, we tag it generic for today + 7, 
         // since they approved the statement!
         deadline.setDate(deadline.getDate() + 7); 
      }

      const updatedTask: Task = {
        ...task,
        smart: {
          specific: { response: assessment.specific.statement || 'User defined', met: true },
          measurable: { response: assessment.measurable.statement || 'User defined', met: true },
          achievable: { response: assessment.achievable.statement || 'User defined', met: true },
          relevant: { response: assessment.relevant.statement || 'User defined', met: true },
          timeBound: { 
            response: assessment.timeBound.statement || "ASAP", 
            met: true, 
            deadline: deadline 
          }
        }
      };
      
      await transitionTask(updatedTask, TASK_STATE.Active);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to make task Active.");
    }
  };

  if (!task) return null;

  // Determine what UI to show based on assessment state
  let uiContent = null;

  if (isGenerating || (!isGenerating && !assessment)) {
    uiContent = (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p>Consulting your Second Brain...</p>
      </div>
    );
  } else if (assessment && !assessment.isComplete) {
    // Find the first unmet criterion
    const unmet = [
      { key: 'specific', data: assessment.specific, label: 'Specificity' },
      { key: 'measurable', data: assessment.measurable, label: 'Measurability' },
      { key: 'achievable', data: assessment.achievable, label: 'Achievability' },
      { key: 'relevant', data: assessment.relevant, label: 'Relevance' },
      { key: 'timeBound', data: assessment.timeBound, label: 'Deadline' }
    ].find(c => !c.data.met && c.data.question);

    if (unmet) {
      const isYesNoQuestion = /^(do|is|are|can|will|should|would|could|did|does|has|have)\b/i.test(unmet.data.question || "");

      uiContent = (
        <div className="grid gap-5 py-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="space-y-4 rounded-xl bg-slate-50 border p-5">
            <h3 className="font-semibold text-emerald-700 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Nudge needs context: {unmet.label}
            </h3>
            <p className="text-slate-700 text-lg">{unmet.data.question}</p>
            
            {unmet.key === 'timeBound' && (unmet.data as any).requiresDate ? (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => handleDateQuickSelect(unmet.data.question!, 0)} disabled={isGenerating}>Today</Button>
                  <Button variant="outline" onClick={() => handleDateQuickSelect(unmet.data.question!, 1)} disabled={isGenerating}>Tomorrow</Button>
                  <Button variant="outline" onClick={() => handleDateQuickSelect(unmet.data.question!, 7)} disabled={isGenerating}>End of Week</Button>
                  <Button variant="outline" onClick={() => handleDateQuickSelect(unmet.data.question!, 30)} disabled={isGenerating}>End of Month</Button>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-sm text-muted-foreground">Or pick custom date:</span>
                  <Input 
                    type="date" 
                    value={currentAnswer} 
                    onChange={(e) => setCurrentAnswer(e.target.value)} 
                    className="w-auto"
                    disabled={isGenerating}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 mt-2">
                {isYesNoQuestion && (
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => handleOverride(unmet.key)} className="flex-1" disabled={isGenerating}>Yes</Button>
                    <Button variant="outline" onClick={() => handleContextSubmit(unmet.data.question!, "No")} className="flex-1" disabled={isGenerating}>No</Button>
                    <Button variant="outline" onClick={() => handleContextSubmit(unmet.data.question!, "I am not sure yet")} className="flex-1" disabled={isGenerating}>Unsure</Button>
                  </div>
                )}
                <Textarea 
                  placeholder={isYesNoQuestion ? "Or elaborate here..." : "Type your answer here..."} 
                  value={currentAnswer} 
                  onChange={(e) => setCurrentAnswer(e.target.value)} 
                  className="min-h-[80px] border-emerald-100 focus-visible:ring-emerald-500"
                  autoFocus
                  disabled={isGenerating}
                />
              </div>
            )}
            
            {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
          </div>
          
          <div className="flex justify-between mt-4">
            <Button variant="ghost" className="text-emerald-700 hover:text-emerald-900" onClick={() => handleOverride(unmet.key)} disabled={isGenerating}>
              Skip (Mark as Met)
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} type="button" disabled={isGenerating}>Pause</Button>
              <Button onClick={() => handleContextSubmit(unmet.data.question!)} type="button" className="gap-2 bg-emerald-600 hover:bg-emerald-700" disabled={isGenerating}>
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </div>
          </div>
        </div>
      );
    }
  } else if (assessment && assessment.isComplete) {
    uiContent = (
      <div className="grid gap-5 py-4 animate-in fade-in zoom-in-95">
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-5 space-y-4">
          <h3 className="font-semibold text-emerald-800 flex items-center gap-2 pb-2 border-b border-emerald-200">
            <Sparkles className="h-5 w-5" /> Task Ready for Action!
          </h3>
          <div className="space-y-3 text-sm text-slate-700">
            <p><strong>Specific:</strong> {assessment.specific.statement}</p>
            <p><strong>Measurable:</strong> {assessment.measurable.statement}</p>
            <p><strong>Achievable:</strong> {assessment.achievable.statement}</p>
            <p><strong>Relevant:</strong> {assessment.relevant.statement}</p>
            <p><strong>Time-Bound:</strong> {assessment.timeBound.statement}</p>
          </div>
          <p className="text-emerald-700 font-medium pt-2">
            Nudge has successfully analyzed your task context and compiled your SMART constraints. Do you want to commit this to your Active board?
          </p>
        </div>
        
        {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
        
        <DialogFooter className="mt-4 border-t pt-4">
          <Button variant="outline" onClick={onClose} type="button">Discard</Button>
          <Button onClick={handleSaveAndActivate} type="button" className="bg-emerald-600 hover:bg-emerald-700">Accept & Make Active</Button>
        </DialogFooter>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto" suppressHydrationWarning>
        <DialogHeader className={assessment?.isComplete ? 'hidden' : 'block'}>
          <DialogTitle className="flex items-center gap-2 text-xl">
            Flesh it out
          </DialogTitle>
          <DialogDescription>
            {task.title}
          </DialogDescription>
        </DialogHeader>
        
        {uiContent}
      </DialogContent>
    </Dialog>
  );
}
