import { ArrowRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Task } from "@/core/types/task";

interface PendingClarificationsListProps {
	tasks: Task[];
	onOpenClarification: (task: Task) => void;
}

export function PendingClarificationsList({
	tasks,
	onOpenClarification,
}: PendingClarificationsListProps) {
	if (tasks.length === 0) return null;

	return (
		<div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
			<div className="flex items-center gap-2 mb-3">
				<HelpCircle className="w-4 h-4 text-amber-500" />
				<h4 className="text-sm font-semibold text-slate-900 dark:text-white">
					Ideas that need a quick question ({tasks.length})
				</h4>
			</div>

			<div className="divide-y divide-slate-100 dark:divide-slate-800">
				{tasks.map((task) => (
					<div
						key={task.id}
						className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
					>
						<div>
							<p className="text-sm font-medium text-slate-800 dark:text-slate-200">
								{task.title}
							</p>
							<span className="text-xs text-slate-400">
								Click to answer a quick multiple-choice question
							</span>
						</div>

						<Button
							size="sm"
							variant="outline"
							onClick={() => onOpenClarification(task)}
							className="rounded-full text-xs shrink-0 border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
						>
							Answer Question
							<ArrowRight className="w-3.5 h-3.5 ml-1.5" />
						</Button>
					</div>
				))}
			</div>
		</div>
	);
}
