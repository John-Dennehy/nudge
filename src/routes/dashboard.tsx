import { createFileRoute } from "@tanstack/react-router";
import { TaskDashboard } from "@/features/tasks/components/TaskDashboard";

export const Route = createFileRoute("/dashboard")({
	component: DashboardPage,
});

function DashboardPage() {
	return (
		<main className="page-wrap px-4 pb-12 pt-8">
			<div className="mb-6 max-w-4xl mx-auto">
				<h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
					Nudge
				</h1>
				<p className="text-slate-500 dark:text-slate-400 mt-1 text-base">
					Drop in your thoughts, take on one manageable step, and build momentum
					at your own pace.
				</p>
			</div>
			<TaskDashboard />
		</main>
	);
}
