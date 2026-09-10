import { describe, expect, it } from "vitest";
import { TASK_STATE } from "@/core/types/task";
import { createUnstickTask, extractMicroAction } from "../unstick";

describe("Unstick Engine (One Fork Rule)", () => {
	describe("extractMicroAction", () => {
		it("throws an error when brain dump is empty or only whitespace", () => {
			expect(() => extractMicroAction("")).toThrow(
				"Brain dump cannot be empty",
			);
			expect(() => extractMicroAction("   \n\t  ")).toThrow(
				"Brain dump cannot be empty",
			);
		});

		it("reduces domestic cleaning/kitchen paralysis to a sub-atomic physical movement (ADR 0002)", () => {
			const dump =
				"Kitchen is a disaster, dishes piled high in the sink, counters dirty, trash overflowing";
			const result = extractMicroAction(dump);

			expect(result.durationMinutes).toBe(2);
			expect(result.suggestedState).toBe("Active");
			expect(result.microAction.toLowerCase()).toContain("one fork");
		});

		it("reduces laundry overwhelm to picking up a single item", () => {
			const dump =
				"Mt. Laundry is taking over the bedroom, clothes everywhere, need to wash, dry, and fold everything";
			const result = extractMicroAction(dump);

			expect(result.durationMinutes).toBe(2);
			expect(result.microAction.toLowerCase()).toContain(
				"one piece of clothing",
			);
		});

		it("reduces financial/tax paralysis to opening a single folder or receipt", () => {
			const dump =
				"Need to file annual tax return, gather all receipts, calculate deductions, check bank statements";
			const result = extractMicroAction(dump);

			expect(result.durationMinutes).toBe(2);
			expect(result.microAction.toLowerCase()).toMatch(/tax|receipt/);
		});

		it("reduces writing/creative block to opening the file and writing a single sentence or title", () => {
			const dump =
				"Must write the 5000 word architecture whitepaper and design spec before end of week";
			const result = extractMicroAction(dump);

			expect(result.durationMinutes).toBe(2);
			expect(result.microAction.toLowerCase()).toMatch(
				/document|sentence|title/,
			);
		});

		it("reduces email overwhelm to reading or archiving a single message", () => {
			const dump =
				"Inbox has 300 unread emails, clients waiting, feeling completely buried";
			const result = extractMicroAction(dump);

			expect(result.durationMinutes).toBe(2);
			expect(result.microAction.toLowerCase()).toMatch(
				/inbox|first email|one email/,
			);
		});

		it("reduces coding/bug paralysis to opening the editor and looking at one line or test", () => {
			const dump =
				"Everything is broken in the build, failing tests everywhere, need to refactor the entire state machine";
			const result = extractMicroAction(dump);

			expect(result.durationMinutes).toBe(2);
			expect(result.microAction.toLowerCase()).toMatch(/editor|test|file/);
		});

		it("handles arbitrary unstructured text gracefully with a safe sub-atomic default", () => {
			const dump = "organize my workshop tools";
			const result = extractMicroAction(dump);

			expect(result.durationMinutes).toBe(2);
			expect(result.microAction).toBeTruthy();
			expect(result.microAction.length).toBeGreaterThan(5);
		});

		it("preserves original brain dump in the result for context", () => {
			const dump = "Call the dentist and reschedule appointment";
			const result = extractMicroAction(dump);

			expect(result.originalDump).toBe(dump);
		});
	});

	describe("createUnstickTask", () => {
		it("instantiates a fully valid Task entity in Active state with a 2-minute deadline", () => {
			const dump =
				"The kitchen is completely disgusting with dishes everywhere";
			const task = createUnstickTask(dump);

			expect(task.id).toBeTruthy();
			expect(task.state).toBe(TASK_STATE.Active);
			expect(task.title).toBeTruthy();
			expect(task.smart.specific?.met).toBe(true);
			expect(task.smart.timeBound?.met).toBe(true);
			expect(task.smart.timeBound?.deadline).toBeInstanceOf(Date);

			// Verify the deadline is approximately 2 minutes in the future
			const now = Date.now();
			const diffSeconds =
				(task.smart.timeBound?.deadline.getTime() - now) / 1000;
			expect(diffSeconds).toBeGreaterThan(110);
			expect(diffSeconds).toBeLessThanOrEqual(130);

			expect(task.subgoalIds).toEqual([]);
			expect(task.prerequisites).toEqual([]);
			expect(task.reviewNotes).toBeNull();
		});
	});
});
