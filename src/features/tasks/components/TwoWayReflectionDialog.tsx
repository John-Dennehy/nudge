import { AlertCircle, ArrowRight, CheckCircle2, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ReviewNotes, Task } from "@/core/types/task";
import { TASK_STATE } from "@/core/types/task";

interface TwoWayReflectionDialogProps {
	task: Task;
	outcome: "succeeded" | "failed";
	onComplete: (updatedTask: Task, replacementTitle?: string) => Promise<void>;
	onClose: () => void;
}

export function TwoWayReflectionDialog({
	task,
	outcome,
	onComplete,
	onClose,
}: TwoWayReflectionDialogProps) {
	// Success state fields
	const [pushedComfortZone, setPushedComfortZone] = useState<boolean | null>(
		null,
	);

	// Failure state fields
	const [wasReasonable, setWasReasonable] = useState<boolean | null>(null);
	const [wasOverwhelmed, setWasOverwhelmed] = useState<boolean | null>(null);
	const [replacementTitle, setReplacementTitle] = useState<string>(
		task.title.length > 30
			? `First 5 minutes of: ${task.title.slice(0, 30)}...`
			: `Try again: ${task.title}`,
	);

	// Common reflection
	const [lesson, setLesson] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const reviewNotes: ReviewNotes = {
				reflection:
					outcome === "succeeded"
						? "Completed successfully"
						: "Encountered friction",
				lesson:
					lesson.trim() ||
					(outcome === "succeeded" ? "Good momentum" : "Needs smaller scope"),
				pushedComfortZone: pushedComfortZone ?? false,
				wasReasonable: wasReasonable ?? true,
				wasOverwhelmed: wasOverwhelmed ?? false,
			};

			const updatedTask: Task = {
				...task,
				state: TASK_STATE.Reviewed,
				reviewNotes,
				updatedAt: new Date().toISOString(),
			};

			await onComplete(
				updatedTask,
				outcome === "failed" && replacementTitle.trim()
					? replacementTitle.trim()
					: undefined,
			);
		} catch (e) {
			console.error(e);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
			<div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8">
				<button
					type="button"
					onClick={onClose}
					className="absolute top-6 right-6 rounded-full p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
				>
					<X className="w-5 h-5" />
				</button>

				{outcome === "succeeded" ? (
					<div>
						<div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 mb-2">
							<CheckCircle2 className="w-6 h-6" />
							<span className="text-xs font-semibold uppercase tracking-wider">
								Well done
							</span>
						</div>
						<h2 className="text-2xl font-bold text-slate-900 dark:text-white">
							Step finished: "{task.title}"
						</h2>
						<p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
							Taking a second to reflect helps build confidence and calibrate
							future goals.
						</p>

						<form onSubmit={handleSubmit} className="mt-6 space-y-5">
							<div>
								<p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
									Did this step stretch you outside your comfort zone?
								</p>
								<div className="grid grid-cols-2 gap-3">
									<button
										type="button"
										onClick={() => setPushedComfortZone(true)}
										className={`p-3.5 rounded-2xl border text-sm font-medium text-left transition-all ${
											pushedComfortZone === true
												? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 font-semibold"
												: "border-slate-200 dark:border-slate-700 hover:border-slate-300"
										}`}
									>
										🌱 Yes, I stretched
									</button>
									<button
										type="button"
										onClick={() => setPushedComfortZone(false)}
										className={`p-3.5 rounded-2xl border text-sm font-medium text-left transition-all ${
											pushedComfortZone === false
												? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 font-semibold"
												: "border-slate-200 dark:border-slate-700 hover:border-slate-300"
										}`}
									>
										☕ Felt comfortable & safe
									</button>
								</div>
							</div>

							<div>
								<label
									htmlFor="lesson-input"
									className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
								>
									Anything you want to remember about what worked? (Optional)
								</label>
								<Input
									id="lesson-input"
									type="text"
									placeholder="e.g. Putting on headphones made starting easy"
									value={lesson}
									onChange={(e) => setLesson(e.target.value)}
									className="rounded-xl"
								/>
							</div>

							<div className="pt-2 flex justify-end gap-3">
								<Button
									type="submit"
									disabled={isSubmitting}
									className="rounded-full px-6 bg-emerald-600 hover:bg-emerald-500 text-white"
								>
									Save Reflection & Continue
									<ArrowRight className="w-4 h-4 ml-2" />
								</Button>
							</div>
						</form>
					</div>
				) : (
					<div>
						<div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 mb-2">
							<AlertCircle className="w-6 h-6" />
							<span className="text-xs font-semibold uppercase tracking-wider">
								Honest reflection
							</span>
						</div>
						<h2 className="text-2xl font-bold text-slate-900 dark:text-white">
							Didn't finish: "{task.title}"
						</h2>
						<p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
							Zero judgment. Learning why friction happened is how we make the
							next step effortless.
						</p>

						<form onSubmit={handleSubmit} className="mt-6 space-y-5">
							<div>
								<p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
									Looking back, was this a reasonable goal?
								</p>
								<div className="grid grid-cols-2 gap-3">
									<button
										type="button"
										onClick={() => setWasReasonable(true)}
										className={`p-3.5 rounded-2xl border text-sm font-medium text-left transition-all ${
											wasReasonable === true
												? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 font-semibold"
												: "border-slate-200 dark:border-slate-700 hover:border-slate-300"
										}`}
									>
										👍 Yes, just timing
									</button>
									<button
										type="button"
										onClick={() => setWasReasonable(false)}
										className={`p-3.5 rounded-2xl border text-sm font-medium text-left transition-all ${
											wasReasonable === false
												? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 font-semibold"
												: "border-slate-200 dark:border-slate-700 hover:border-slate-300"
										}`}
									>
										📦 No, too big or fuzzy
									</button>
								</div>
							</div>

							<div>
								<p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
									Did you feel overwhelmed?
								</p>
								<div className="grid grid-cols-2 gap-3">
									<button
										type="button"
										onClick={() => setWasOverwhelmed(true)}
										className={`p-3.5 rounded-2xl border text-sm font-medium text-left transition-all ${
											wasOverwhelmed === true
												? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 font-semibold"
												: "border-slate-200 dark:border-slate-700 hover:border-slate-300"
										}`}
									>
										🌪️ Yes, hit a mental wall
									</button>
									<button
										type="button"
										onClick={() => setWasOverwhelmed(false)}
										className={`p-3.5 rounded-2xl border text-sm font-medium text-left transition-all ${
											wasOverwhelmed === false
												? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 font-semibold"
												: "border-slate-200 dark:border-slate-700 hover:border-slate-300"
										}`}
									>
										🔄 No, just interrupted
									</button>
								</div>
							</div>

							<div>
								<label
									htmlFor="replacement-input"
									className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
								>
									Let's try a smaller replacement step:
								</label>
								<Input
									id="replacement-input"
									type="text"
									value={replacementTitle}
									onChange={(e) => setReplacementTitle(e.target.value)}
									className="rounded-xl"
									placeholder="e.g. Just open the document for 60 seconds"
								/>
							</div>

							<div className="pt-2 flex justify-end gap-3">
								<Button
									type="submit"
									disabled={isSubmitting}
									className="rounded-full px-6 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900"
								>
									Save Reflection & Calibrate Next Step
									<ArrowRight className="w-4 h-4 ml-2" />
								</Button>
							</div>
						</form>
					</div>
				)}
			</div>
		</div>
	);
}
