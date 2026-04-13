import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
	return (
		<main className="page-wrap px-4 pb-8 pt-14">
			<section className="island-shell rise-in relative overflow-hidden rounded-4xl px-6 py-10 sm:px-10 sm:py-14">
				<p className="island-kicker mb-4">Your second brain</p>
				<h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-(--sea-ink) sm:text-6xl">
					Welcome to Nudge
				</h1>
				<p className="max-w-xl text-lg text-(--sea-ink-soft) leading-relaxed">
					A task tool built for the way your mind actually works. Capture ideas,
					define goals, and let Nudge help you figure out what to do next —
					without the overwhelm.
				</p>
				<div className="mt-8">
					<Button asChild size="lg" className="rounded-full px-8">
						<Link to="/dashboard">Open Dashboard</Link>
					</Button>
				</div>
			</section>
		</main>
	);
}
