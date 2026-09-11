import { CheckCheck, Compass, Lightbulb, Sparkles } from "lucide-react";
import type { QuietProgress } from "@/core/types/task";

interface QuietProgressBannerProps {
	progress: QuietProgress;
}

export function QuietProgressBanner({ progress }: QuietProgressBannerProps) {
	const hasAny =
		progress.thoughtsUntangled > 0 ||
		progress.microStepsCompleted > 0 ||
		progress.reflectionsCaptured > 0 ||
		progress.comfortZonesExpanded > 0;

	return (
		<div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
			<div className="flex items-center gap-2">
				<Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
				<span className="font-medium text-slate-800 dark:text-slate-200">
					Your Momentum Today:
				</span>
			</div>

			{hasAny ? (
				<div className="flex flex-wrap items-center gap-3 sm:gap-4">
					{progress.thoughtsUntangled > 0 && (
						<span className="flex items-center gap-1.5">
							<Lightbulb className="w-3.5 h-3.5 text-amber-500" />
							<strong className="text-slate-900 dark:text-white font-semibold">
								{progress.thoughtsUntangled}
							</strong>{" "}
							{progress.thoughtsUntangled === 1
								? "thought untangled"
								: "thoughts untangled"}
						</span>
					)}

					{progress.microStepsCompleted > 0 && (
						<span className="flex items-center gap-1.5">
							<CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
							<strong className="text-slate-900 dark:text-white font-semibold">
								{progress.microStepsCompleted}
							</strong>{" "}
							{progress.microStepsCompleted === 1
								? "step finished"
								: "steps finished"}
						</span>
					)}

					{progress.reflectionsCaptured > 0 && (
						<span className="flex items-center gap-1.5">
							<Compass className="w-3.5 h-3.5 text-blue-500" />
							<strong className="text-slate-900 dark:text-white font-semibold">
								{progress.reflectionsCaptured}
							</strong>{" "}
							{progress.reflectionsCaptured === 1
								? "lesson recorded"
								: "lessons recorded"}
						</span>
					)}

					{progress.comfortZonesExpanded > 0 && (
						<span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-medium">
							🌱 {progress.comfortZonesExpanded}{" "}
							{progress.comfortZonesExpanded === 1
								? "comfort zone stretched"
								: "comfort zones stretched"}
						</span>
					)}
				</div>
			) : (
				<span className="text-slate-400 dark:text-slate-500 italic">
					Ready when you are. Take it one small bite at a time.
				</span>
			)}
		</div>
	);
}
