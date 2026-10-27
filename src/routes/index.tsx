import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

const STEPS = [
	{
		title: 'Dump it',
		text: 'Write whatever is on your mind, however messy. No forms, no categories, no deciding anything yet.',
	},
	{
		title: 'Answer one small question',
		text: 'Nudge sorts the dump into separate goals. Where something is too big or fuzzy, it asks one question at a time, with a few answers to pick from.',
	},
	{
		title: 'Pick one thing',
		text: 'Say how much energy you have, and Nudge offers a few options that fit, each with a reason. Pick one. That is the only thing on screen.',
	},
	{
		title: 'Learn from how it went',
		text: 'Done, or not done by its date: both are feedback. Nudge learns from the pattern and pitches the next goal so it is a stretch, but a doable one.',
	},
]

const IDEAS = [
	{
		title: 'Failing is practice',
		text: 'Goals that pass their date fail by themselves, so you never have to mark them. A miss is shown plainly, as a lesson, and leads to a better-sized next try.',
	},
	{
		title: 'No streaks, no scores',
		text: 'Quiet Progress counts the work that is easy to miss: thoughts untangled, small steps done, lessons learned.',
	},
	{
		title: 'Plain words only',
		text: 'No jargon anywhere. The app is tested against a list of words it must never use.',
	},
	{
		title: 'Private by default',
		text: 'No sign-up. Your list lives in a private space tied to this browser, and you can link another device or delete everything at any time.',
	},
]

function Home() {
	return (
		<div className="space-y-16 pt-8">
			<section className="space-y-6">
				<p className="eyebrow">For ADHD and autistic minds</p>
				<h1 className="text-4xl leading-tight font-bold sm:text-5xl">
					Too much in your head? Dump it here, and do the next small thing.
				</h1>
				<p className="max-w-xl text-lg text-muted">
					Nudge turns a messy brain dump into small, clear steps, asks one question at a time
					instead of making you fill in forms, and treats every miss as feedback rather than a
					failure of character.
				</p>
				<Link to="/today" className="btn-primary text-lg">
					Start with a brain dump
				</Link>
			</section>

			<section aria-labelledby="how" className="space-y-6">
				<h2 id="how" className="text-2xl font-bold">
					How it works
				</h2>
				<ol className="grid gap-4 sm:grid-cols-2">
					{STEPS.map((step, i) => (
						<li key={step.title} className="panel p-6">
							<p className="eyebrow">Step {i + 1}</p>
							<h3 className="mt-2 text-xl font-bold">{step.title}</h3>
							<p className="mt-2 text-muted">{step.text}</p>
						</li>
					))}
				</ol>
			</section>

			<section aria-labelledby="ideas" className="space-y-6">
				<h2 id="ideas" className="text-2xl font-bold">
					What makes it different
				</h2>
				<ul className="grid gap-4 sm:grid-cols-2">
					{IDEAS.map((idea) => (
						<li key={idea.title} className="rounded-3xl bg-sage-soft p-6">
							<h3 className="text-lg font-bold">{idea.title}</h3>
							<p className="mt-2 text-ink/80">{idea.text}</p>
						</li>
					))}
				</ul>
			</section>
		</div>
	)
}
