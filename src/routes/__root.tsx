import { createRootRoute, HeadContent, Link, Outlet, Scripts } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import appCss from '../styles.css?url'

const description =
	'A gentle second brain for ADHD and autistic minds. Dump what is on your mind, and Nudge turns it into small, doable next steps.'

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ title: 'Nudge' },
			{ name: 'description', content: description },
			{ name: 'theme-color', content: '#3f6f58' },
			{ property: 'og:title', content: 'Nudge' },
			{ property: 'og:description', content: description },
		],
		links: [
			{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
			{ rel: 'preconnect', href: 'https://fonts.googleapis.com' },
			{ rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
			{
				rel: 'stylesheet',
				href: 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;700&family=Fraunces:opsz,wght@9..144,500;9..144,700&display=swap',
			},
			{ rel: 'stylesheet', href: appCss },
		],
	}),
	component: RootLayout,
	shellComponent: RootDocument,
	notFoundComponent: NotFound,
})

function RootDocument({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	)
}

function RootLayout() {
	return (
		<div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4">
			<a
				href="#main"
				className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2"
			>
				Skip to the main part
			</a>
			<header className="flex items-center justify-between py-5">
				<Link to="/" className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
					<img src="/favicon.svg" alt="" className="size-8" />
					Nudge
				</Link>
				<nav aria-label="Main" className="flex gap-1 text-sm font-bold">
					<Link to="/today" className="btn-ghost [&.active]:text-sage">
						Today
					</Link>
					<Link to="/progress" className="btn-ghost [&.active]:text-sage">
						Progress
					</Link>
				</nav>
			</header>
			<main id="main" className="flex-1 pb-16">
				<Outlet />
			</main>
			<footer className="py-6 text-center text-sm text-muted">
				Made by{' '}
				<a className="underline hover:text-ink" href="https://johndennehy.dev">
					John Dennehy
				</a>{' '}
				·{' '}
				<a className="underline hover:text-ink" href="https://github.com/John-Dennehy/nudge">
					Source on GitHub
				</a>
			</footer>
		</div>
	)
}

function NotFound() {
	return (
		<div className="py-24 text-center">
			<h1 className="text-3xl">Nothing here</h1>
			<p className="mt-3 text-muted">That page doesn't exist. No harm done.</p>
			<Link to="/today" className="btn-primary mt-8">
				Go to today
			</Link>
		</div>
	)
}
