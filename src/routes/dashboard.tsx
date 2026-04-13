import { createFileRoute } from "@tanstack/react-router";
import { TaskBoard } from "@/features/tasks/components/TaskBoard";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <main className="page-wrap px-4 pb-8 pt-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Your Nudge Board</h1>
        <p className="text-muted-foreground mt-2 text-lg">Define your goals. Turn ideas into actionable steps.</p>
      </div>
      <TaskBoard />
    </main>
  );
}
