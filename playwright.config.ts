import { defineConfig, devices } from '@playwright/test'

const PORT = 3100

export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		baseURL: `http://localhost:${PORT}`,
		trace: 'retain-on-failure',
		launchOptions: process.env.CHROMIUM_PATH
			? { executablePath: process.env.CHROMIUM_PATH }
			: undefined,
	},
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] } },
		{ name: 'mobile', use: { ...devices['Pixel 7'] } },
	],
	webServer: {
		// No DATABASE_URL or GEMINI_API_KEY here: memory storage and the built-in rules
		command: `pnpm build && PORT=${PORT} DATABASE_URL= GEMINI_API_KEY= pnpm start`,
		url: `http://localhost:${PORT}`,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000,
	},
})
