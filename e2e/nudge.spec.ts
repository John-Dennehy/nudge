import { expect, type Page, test } from '@playwright/test'

async function dump(page: Page, text: string) {
	await page.goto('/today')
	await page.getByRole('textbox', { name: /on your mind/ }).fill(text)
	await page.getByRole('button', { name: 'Untangle it' }).click()
}

/** Answers every waiting question by picking the first card with the keyboard. */
async function answerAll(page: Page) {
	const deck = page.getByTestId('deck')
	for (let i = 0; i < 12 && (await deck.count()); i++) {
		const question = await deck.getByRole('heading').textContent()
		await deck.getByRole('group').getByRole('button').first().focus()
		await page.keyboard.press('Enter')
		await expect(deck.getByRole('heading'))
			.not.toHaveText(question ?? '', { timeout: 2000 })
			.catch(() => {})
	}
	await expect(deck).toHaveCount(0)
}

test('the full loop: dump, answer, pick, finish and reflect', async ({ page }) => {
	await page.goto('/')
	await page.getByRole('link', { name: 'Start with a brain dump' }).click()
	await dump(page, 'call the dentist by Friday\nsort out my taxes')

	await expect(page.getByTestId('deck')).toBeVisible()
	await expect(page.getByTestId('deck').getByRole('heading')).toHaveText(
		'Why does this matter to you?',
	)
	await answerAll(page)

	await page.locator('label', { hasText: 'Okay' }).click()
	const suggestions = page.getByRole('list', { name: 'Suggestions' })
	await expect(suggestions.getByRole('listitem').first()).toBeVisible()
	await suggestions.getByRole('button', { name: 'Do this one' }).first().click()

	const agreed = page.getByTestId('agreed')
	await expect(agreed).toBeVisible()
	await expect(agreed.getByText('Done when')).toBeVisible()
	await agreed.getByRole('button', { name: 'Done', exact: true }).click()

	const feedback = page.getByTestId('feedback')
	await expect(feedback.getByText('Done', { exact: true })).toBeVisible()
	await feedback.getByText('Yes', { exact: true }).click()
	await feedback.getByText('About right').click()
	await feedback.getByRole('button', { name: 'Save' }).click()
	await expect(feedback).toHaveCount(0)
	await expect(page.getByText(/Today so far:.*1 thing done/)).toBeVisible()

	// Everything survives a reload.
	await page.reload()
	await expect(page.getByText(/1 thing done/)).toBeVisible()

	await page.getByRole('link', { name: 'Progress', exact: true }).click()
	await expect(page.getByText('1 comfort zone stretched')).toBeVisible()
	await expect(page.getByText('After 4 more things finish')).toBeVisible()
})

test('a miss is shown plainly as feedback and leads to a fresh try', async ({ page }) => {
	await dump(page, 'text Jo today')
	await answerAll(page)
	await page.locator('label', { hasText: 'Low' }).click()
	await page.getByRole('button', { name: 'Do this one' }).click()
	await page.getByTestId('agreed').getByRole('button', { name: 'Failed' }).click()

	const feedback = page.getByTestId('feedback')
	await expect(feedback.getByText('Failed', { exact: true })).toBeVisible()
	await expect(feedback).toContainText('That’s feedback, not a verdict')
	await expect(feedback).toContainText('ran out of time')
	await feedback.getByRole('group', { name: 'Did you feel overwhelmed?' }).getByText('Yes').click()
	await feedback.getByRole('button', { name: 'Save' }).click()

	await page.getByText(/See everything/).click()
	await expect(page.getByText('Text Jo').first()).toBeVisible()
	await expect(page.getByText(/1 lesson learned/)).toBeVisible()
})

test('the cards work from the keyboard, and a write-in is read for the question asked', async ({
	page,
}) => {
	await dump(page, 'call the bank')
	const deck = page.getByTestId('deck')
	await expect(deck.getByRole('heading')).toHaveText('When should this be done by?')
	await deck.getByPlaceholder(/write a day/).fill('whenever')
	await deck.getByRole('button', { name: 'Use this' }).click()
	await expect(deck.getByRole('alert')).toContainText(/catch a day/)
	await deck.getByPlaceholder(/write a day/).fill('tomorrow')
	await deck.getByRole('button', { name: 'Use this' }).click()
	await expect(deck.getByRole('heading')).toHaveText('Why does this matter to you?')

	// Number keys pick straight away once the hand has focus.
	await deck.getByRole('group').getByRole('button').first().focus()
	await page.keyboard.press('ArrowRight')
	await expect(deck.getByRole('group').getByRole('button').nth(1)).toBeFocused()
	await page.keyboard.press('2')
	await expect(deck).toHaveCount(0)
})

test('another device can be linked with a code', async ({ page, browser }) => {
	await dump(page, 'water the plants today')
	await page.goto('/progress')
	await page.getByRole('button', { name: 'Get a linking code' }).click()
	const code = await page.locator('strong.font-mono').textContent()
	expect(code).toMatch(/^[a-z]+-[a-z]+-\d{2}$/)

	const other = await browser.newPage()
	await other.goto(`${new URL(page.url()).origin}/progress`)
	await other.getByRole('textbox', { name: /code from another device/ }).fill(code ?? '')
	await other.getByRole('button', { name: 'Link this device' }).click()
	await expect(other).toHaveURL(/\/today/)
	await other.getByText(/See everything/).click()
	await expect(other.getByRole('listitem').getByText('Water the plants')).toBeVisible()
	await other.close()
})

test('delete everything starts afresh', async ({ page }) => {
	await dump(page, 'post the letter today')
	await expect(page.getByTestId('deck')).toBeVisible()
	await page.goto('/progress')
	await page.getByRole('button', { name: 'Delete everything' }).click()
	await page.getByRole('button', { name: 'Yes, delete it all' }).click()
	await expect(page).toHaveURL(/\/$/)
	await page.goto('/today')
	await expect(page.getByRole('textbox', { name: "What's on your mind?" })).toBeVisible()
})
