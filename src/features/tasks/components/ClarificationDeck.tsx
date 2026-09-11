import { CornerDownLeft, Play, Sparkles, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ClarificationCard, ClarificationOption } from "@/core/types/task";

interface ClarificationDeckProps {
	card: ClarificationCard;
	goalTitle: string;
	onSelectOption: (
		option: ClarificationOption | { id: string; label: string },
	) => void;
	onDismiss: () => void;
}

export function ClarificationDeck({
	card,
	goalTitle,
	onSelectOption,
	onDismiss,
}: ClarificationDeckProps) {
	const [selectedIndex, setSelectedIndex] = useState<number>(0);
	const [writeInText, setWriteInText] = useState("");
	const writeInRef = useRef<HTMLInputElement>(null);

	// Keyboard navigation listener (Balatro style)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// If user is typing in the write-in input, let normal typing proceed
			if (document.activeElement === writeInRef.current) {
				if (e.key === "Enter" && writeInText.trim()) {
					e.preventDefault();
					onSelectOption({
						id: crypto.randomUUID(),
						label: writeInText.trim(),
					});
				} else if (e.key === "Escape") {
					e.preventDefault();
					onDismiss();
				}
				return;
			}

			if (e.key === "ArrowRight" || e.key === "l") {
				e.preventDefault();
				setSelectedIndex((prev) => (prev + 1) % card.options.length);
			} else if (e.key === "ArrowLeft" || e.key === "h") {
				e.preventDefault();
				setSelectedIndex(
					(prev) => (prev - 1 + card.options.length) % card.options.length,
				);
			} else if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				const selected = card.options[selectedIndex];
				if (selected) onSelectOption(selected);
			} else if (e.key === "Escape") {
				e.preventDefault();
				onDismiss();
			} else {
				// Direct number keys (1, 2, 3...)
				const num = Number.parseInt(e.key, 10);
				if (!Number.isNaN(num) && num >= 1 && num <= card.options.length) {
					e.preventDefault();
					setSelectedIndex(num - 1);
					const selected = card.options[num - 1];
					if (selected) onSelectOption(selected);
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [card.options, selectedIndex, writeInText, onSelectOption, onDismiss]);

	const handleConfirmSelected = () => {
		const selected = card.options[selectedIndex];
		if (selected) onSelectOption(selected);
	};

	const handleWriteInSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!writeInText.trim()) return;
		onSelectOption({
			id: crypto.randomUUID(),
			label: writeInText.trim(),
		});
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
			<div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 flex flex-col">
				{/* Header with dismiss */}
				<div className="flex items-start justify-between gap-4 mb-3">
					<div>
						<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
							<Sparkles className="w-3.5 h-3.5" />
							Let's make this easier to start
						</span>
						<h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-2">
							{card.question}
						</h2>
						<p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
							Working on:{" "}
							<span className="font-medium text-slate-700 dark:text-slate-300">
								"{goalTitle}"
							</span>
						</p>
					</div>
					<button
						type="button"
						onClick={onDismiss}
						className="rounded-full p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
						title="Dismiss for now (Esc)"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Balatro-Style Hand of Cards */}
				<div className="my-6">
					<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch justify-center">
						{card.options.map((option, idx) => {
							const isSelected = selectedIndex === idx;
							return (
								<button
									type="button"
									key={option.id}
									onClick={() => {
										setSelectedIndex(idx);
									}}
									onDoubleClick={() => onSelectOption(option)}
									className={`relative flex-1 cursor-pointer rounded-2xl p-4 sm:p-5 transition-all duration-200 select-none border-2 flex flex-col justify-between text-left ${
										isSelected
											? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-500 dark:border-amber-400 shadow-lg -translate-y-2 scale-[1.02]"
											: "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-1"
									}`}
								>
									<div>
										<div className="flex items-center justify-between mb-2">
											<span
												className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
													isSelected
														? "bg-amber-500 text-white"
														: "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
												}`}
											>
												{idx + 1}
											</span>
											{isSelected && (
												<span className="text-[10px] font-semibold tracking-wide uppercase text-amber-600 dark:text-amber-400">
													Selected
												</span>
											)}
										</div>
										<h3 className="text-base font-semibold text-slate-900 dark:text-white leading-snug">
											{option.label}
										</h3>
									</div>
									{option.subtext && (
										<p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
											{option.subtext}
										</p>
									)}
								</button>
							);
						})}
					</div>

					{/* Action button for active card */}
					<div className="mt-4 flex justify-center">
						<Button
							size="lg"
							onClick={handleConfirmSelected}
							className="rounded-full px-8 bg-amber-600 hover:bg-amber-500 text-white font-medium shadow-md transition-transform active:scale-95"
						>
							<Play className="w-4 h-4 mr-2 fill-current" />
							Choose Option {selectedIndex + 1}{" "}
							<span className="text-xs opacity-75 ml-1.5">(Enter)</span>
						</Button>
					</div>
				</div>

				{/* Write-in fallback */}
				{card.allowWriteIn && (
					<form
						onSubmit={handleWriteInSubmit}
						className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2"
					>
						<Input
							ref={writeInRef}
							type="text"
							placeholder="Or write in your own quick starting step..."
							value={writeInText}
							onChange={(e) => setWriteInText(e.target.value)}
							className="rounded-xl text-sm"
						/>
						<Button
							type="submit"
							variant="outline"
							disabled={!writeInText.trim()}
							className="rounded-xl shrink-0"
						>
							<CornerDownLeft className="w-4 h-4 mr-1.5" />
							Use This
						</Button>
					</form>
				)}

				{/* Keyboard hint */}
				<div className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
					Tip: Use{" "}
					<kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">
						←
					</kbd>{" "}
					<kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">
						→
					</kbd>{" "}
					or number keys to pick,{" "}
					<kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">
						Enter
					</kbd>{" "}
					to confirm,{" "}
					<kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">
						Esc
					</kbd>{" "}
					to exit
				</div>
			</div>
		</div>
	);
}
