import {
	ArrowRight,
	Clock,
	Coffee,
	ShieldAlert,
	Sparkles,
	Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdaptiveNudge } from "@/core/types/task";

interface AdaptiveNudgesListProps {
	nudges: AdaptiveNudge[];
	onSelectNudge: (nudge: AdaptiveNudge) => void;
}

export function AdaptiveNudgesList({
	nudges,
	onSelectNudge,
}: AdaptiveNudgesListProps) {
	if (nudges.length === 0) {
		return null;
	}

	const getArchetypeBadge = (archetype: AdaptiveNudge["archetype"]) => {
		switch (archetype) {
			case "momentum":
				return {
					icon: <Coffee className="w-3.5 h-3.5" />,
					color:
						"bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
					title: "Momentum",
				};
			case "dread":
				return {
					icon: <ShieldAlert className="w-3.5 h-3.5" />,
					color:
						"bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
					title: "Clear the Dread",
				};
			case "leverage":
				return {
					icon: <Zap className="w-3.5 h-3.5" />,
					color:
						"bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
					title: "Best Return",
				};
			case "urgent_slice":
				return {
					icon: <Clock className="w-3.5 h-3.5" />,
					color:
						"bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
					title: "Approaching Date",
				};
			default:
				return {
					icon: <Sparkles className="w-3.5 h-3.5" />,
					color:
						"bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
					title: "Suggestion",
				};
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						Choose your next step
					</h3>
					<p className="text-xs text-slate-500 dark:text-slate-400">
						Pick whatever matches your current energy and headspace.
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{nudges.map((nudge) => {
					const badge = getArchetypeBadge(nudge.archetype);
					return (
						<div
							key={nudge.task.id}
							className="group relative flex flex-col justify-between rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all"
						>
							<div>
								<div className="flex items-center justify-between gap-2 mb-3">
									<span
										className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.color}`}
									>
										{badge.icon}
										{nudge.label}
									</span>
									{nudge.estimatedMinutes && (
										<span className="text-xs text-slate-400 font-mono">
											~{nudge.estimatedMinutes}m
										</span>
									)}
								</div>

								<h4 className="text-base font-semibold text-slate-900 dark:text-white leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
									{nudge.task.title}
								</h4>

								<p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
									{nudge.reason}
								</p>
							</div>

							<div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
								<Button
									size="sm"
									onClick={() => onSelectNudge(nudge)}
									className="rounded-full text-xs font-medium px-4 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-sm"
								>
									Take this on
									<ArrowRight className="w-3.5 h-3.5 ml-1.5" />
								</Button>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
