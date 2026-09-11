import {
	AlertCircle,
	CheckCircle,
	RefreshCw,
	Scissors,
	Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Task } from "@/core/types/task";

interface AgreedTaskHeroProps {
	task: Task;
	onMarkDone: () => void;
	onMarkFailed: () => void;
	onSwitchTask: () => void;
	onMakeSmaller: () => void;
}

export function AgreedTaskHero({
	task,
	onMarkDone,
	onMarkFailed,
	onSwitchTask,
	onMakeSmaller,
}: AgreedTaskHeroProps) {
	return (
		<div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-700/50">
			{/* Background glow decoration */}
			<div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
			<div className="absolute -left-20 -bottom-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

			<div className="relative z-10">
				<div className="flex flex-wrap items-center justify-between gap-3 mb-4">
					<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
						<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
						Current Focus
					</div>
					<span className="text-xs text-slate-400 font-mono">
						No countdown timers. Work at your own pace.
					</span>
				</div>

				<h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
					{task.title}
				</h2>

				{task.smart?.measurable?.response && (
					<p className="mt-2 text-sm text-slate-300 flex items-center gap-1.5">
						<Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
						<span>Target: {task.smart.measurable.response}</span>
					</p>
				)}

				{/* Action Buttons */}
				<div className="mt-8 flex flex-wrap items-center gap-3 pt-4 border-t border-slate-700/50">
					<Button
						size="lg"
						onClick={onMarkDone}
						className="rounded-full px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold shadow-md transition-transform active:scale-95"
					>
						<CheckCircle className="w-4 h-4 mr-2" />
						Mark Done
					</Button>

					<Button
						size="lg"
						variant="outline"
						onClick={onMarkFailed}
						className="rounded-full px-5 border-slate-600 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white"
					>
						<AlertCircle className="w-4 h-4 mr-2 text-amber-400" />
						Couldn't Finish
					</Button>

					<Button
						size="sm"
						variant="ghost"
						onClick={onMakeSmaller}
						className="rounded-full text-slate-300 hover:text-white hover:bg-slate-800 ml-auto"
						title="Break this task down if it feels too big"
					>
						<Scissors className="w-4 h-4 mr-1.5 text-amber-400" />
						Make Smaller
					</Button>

					<Button
						size="sm"
						variant="ghost"
						onClick={onSwitchTask}
						className="rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
						title="Pick a different option from the list"
					>
						<RefreshCw className="w-4 h-4 mr-1.5" />
						Switch Task
					</Button>
				</div>
			</div>
		</div>
	);
}
