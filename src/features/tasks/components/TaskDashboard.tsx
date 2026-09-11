import { useMemo, useState } from "react";
import {
	type AdaptiveNudge,
	type ClarificationCard,
	type ClarificationOption,
	TASK_STATE,
	type Task,
} from "@/core/types/task";
import { deconstructBrainDump } from "../api/deconstructBrainDump";
import {
	useAddTask,
	useQuietProgress,
	useTasks,
	useUpdateTask,
} from "../hooks/useTasks";
import { selectAdaptiveNudges } from "../utils/nudges";
import { AdaptiveNudgesList } from "./AdaptiveNudgesList";
import { AgreedTaskHero } from "./AgreedTaskHero";
import { BrainDumpBar } from "./BrainDumpBar";
import { ClarificationDeck } from "./ClarificationDeck";
import { PendingClarificationsList } from "./PendingClarificationsList";
import { QuietProgressBanner } from "./QuietProgressBanner";
import { TwoWayReflectionDialog } from "./TwoWayReflectionDialog";

export function TaskDashboard() {
	const { data: tasks = [], isLoading } = useTasks();
	const updateTask = useUpdateTask();
	const addTask = useAddTask();
	const { progress, recordProgress } = useQuietProgress();

	const [isDeconstructing, setIsDeconstructing] = useState(false);
	const [activeClarification, setActiveClarification] = useState<{
		task: Task;
		card: ClarificationCard;
	} | null>(null);
	const [reflectionState, setReflectionState] = useState<{
		task: Task;
		outcome: "succeeded" | "failed";
	} | null>(null);

	// Find the single current Agreed Task (Active state)
	const agreedTask = useMemo(() => {
		return tasks.find((t) => t.state === TASK_STATE.Active) || null;
	}, [tasks]);

	// Curate adaptive nudges from available tasks
	const adaptiveNudges = useMemo(() => {
		return selectAdaptiveNudges(tasks);
	}, [tasks]);

	// Tasks in Ideas state waiting for clarification
	const pendingIdeas = useMemo(() => {
		return tasks.filter((t) => t.state === TASK_STATE.Ideas);
	}, [tasks]);

	// Handler for Brain Dump bar
	const handleBrainDump = async (text: string) => {
		setIsDeconstructing(true);
		try {
			// @ts-expect-error TanStack Start server function type inference
			const result = await deconstructBrainDump({ data: { text } });

			let cardToOpen: { task: Task; card: ClarificationCard } | null = null;

			for (const goal of result.goals) {
				const newTask: Task = {
					id: crypto.randomUUID(),
					title: goal.title,
					state: goal.isAtomic ? TASK_STATE.Defined : TASK_STATE.Ideas,
					smart: {
						specific: { response: goal.title, met: goal.isAtomic },
					},
					subgoalIds: [],
					parentId: null,
					prerequisites: [],
					reviewNotes: null,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};

				await updateTask.mutateAsync(newTask);

				if (!goal.isAtomic && goal.clarificationCard && !cardToOpen) {
					cardToOpen = { task: newTask, card: goal.clarificationCard };
				}
			}

			await recordProgress({
				metric: "thoughtsUntangled",
				amount: result.goals.length,
			});

			if (cardToOpen) {
				setActiveClarification(cardToOpen);
			}
		} catch (e) {
			console.error("Failed to deconstruct brain dump:", e);
			// Fallback: add single idea
			await addTask.mutateAsync(text);
		} finally {
			setIsDeconstructing(false);
		}
	};

	// Taking on a nudge as the Agreed Task
	const handleSelectNudge = async (nudge: AdaptiveNudge) => {
		// If another task is currently active, transition it back to Defined
		if (agreedTask) {
			await updateTask.mutateAsync({
				...agreedTask,
				state: TASK_STATE.Defined,
				updatedAt: new Date().toISOString(),
			});
		}

		// Set chosen task to Active
		await updateTask.mutateAsync({
			...nudge.task,
			state: TASK_STATE.Active,
			updatedAt: new Date().toISOString(),
		});
	};

	// Switch task back to Defined
	const handleSwitchTask = async () => {
		if (!agreedTask) return;
		await updateTask.mutateAsync({
			...agreedTask,
			state: TASK_STATE.Defined,
			updatedAt: new Date().toISOString(),
		});
	};

	// Break active task into a smaller step
	const handleMakeSmaller = (task: Task) => {
		const card: ClarificationCard = {
			id: crypto.randomUUID(),
			taskId: task.id,
			question: "How can we make this step smaller and easier?",
			options: [
				{
					id: crypto.randomUUID(),
					label: `Spend just 2 minutes inspecting: ${task.title.slice(0, 25)}...`,
					subtext: "Near-zero friction to break inertia",
				},
				{
					id: crypto.randomUUID(),
					label: "Open the relevant workspace or file and stop there",
					subtext: "Physical set-up step only",
				},
				{
					id: crypto.randomUUID(),
					label: "Write down the first 3 small sub-steps",
					subtext: "Clarify without executing yet",
				},
			],
			allowWriteIn: true,
		};
		setActiveClarification({ task, card });
	};

	// Handle Clarification Card selection
	const handleClarificationOption = async (
		option: ClarificationOption | { id: string; label: string },
	) => {
		if (!activeClarification) return;

		const { task } = activeClarification;
		const updated: Task = {
			...task,
			title: option.label,
			state: TASK_STATE.Defined, // Now atomic & ready
			smart: {
				...task.smart,
				specific: { response: option.label, met: true },
			},
			updatedAt: new Date().toISOString(),
		};

		await updateTask.mutateAsync(updated);
		await recordProgress({ metric: "thoughtsUntangled", amount: 1 });
		setActiveClarification(null);
	};

	// Handle Two-Way Reflection completion
	const handleReflectionComplete = async (
		updatedTask: Task,
		replacementTitle?: string,
	) => {
		await updateTask.mutateAsync(updatedTask);

		if (reflectionState?.outcome === "succeeded") {
			await recordProgress({ metric: "microStepsCompleted", amount: 1 });
			if (updatedTask.reviewNotes?.pushedComfortZone) {
				await recordProgress({ metric: "comfortZonesExpanded", amount: 1 });
			}
		} else {
			await recordProgress({ metric: "reflectionsCaptured", amount: 1 });
			if (replacementTitle) {
				const replacement: Task = {
					id: crypto.randomUUID(),
					title: replacementTitle,
					state: TASK_STATE.Defined,
					smart: { specific: { response: replacementTitle, met: true } },
					subgoalIds: [],
					parentId: updatedTask.id,
					prerequisites: [],
					reviewNotes: null,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};
				await updateTask.mutateAsync(replacement);
			}
		}

		setReflectionState(null);
	};

	if (isLoading) {
		return (
			<div className="p-12 text-center text-slate-400 animate-pulse">
				Loading Nudge...
			</div>
		);
	}

	return (
		<div className="space-y-8 max-w-4xl mx-auto">
			{/* 1. Quiet Progress Banner */}
			<QuietProgressBanner progress={progress} />

			{/* 2. Brain Dump Intake Bar */}
			<BrainDumpBar
				onDeconstructAndAdd={handleBrainDump}
				isLoading={isDeconstructing}
			/>

			{/* 3. Agreed Task Hero (if any task is currently active) */}
			{agreedTask ? (
				<AgreedTaskHero
					task={agreedTask}
					onMarkDone={() =>
						setReflectionState({ task: agreedTask, outcome: "succeeded" })
					}
					onMarkFailed={() =>
						setReflectionState({ task: agreedTask, outcome: "failed" })
					}
					onSwitchTask={handleSwitchTask}
					onMakeSmaller={() => handleMakeSmaller(agreedTask)}
				/>
			) : null}

			{/* 4. Adaptive Nudges Selector (options to choose from) */}
			<AdaptiveNudgesList
				nudges={adaptiveNudges}
				onSelectNudge={handleSelectNudge}
			/>

			{/* 5. Pending Clarifications (Ideas needing a quick question) */}
			<PendingClarificationsList
				tasks={pendingIdeas}
				onOpenClarification={(task) => handleMakeSmaller(task)}
			/>

			{/* Balatro-Style Clarification Deck Modal */}
			{activeClarification ? (
				<ClarificationDeck
					card={activeClarification.card}
					goalTitle={activeClarification.task.title}
					onSelectOption={handleClarificationOption}
					onDismiss={() => setActiveClarification(null)}
				/>
			) : null}

			{/* Two-Way Reflection Dialog */}
			{reflectionState ? (
				<TwoWayReflectionDialog
					task={reflectionState.task}
					outcome={reflectionState.outcome}
					onComplete={handleReflectionComplete}
					onClose={() => setReflectionState(null)}
				/>
			) : null}
		</div>
	);
}
