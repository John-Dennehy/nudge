import { Loader2, Plus, Sparkles } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BrainDumpBarProps {
	onDeconstructAndAdd: (text: string) => Promise<void>;
	isLoading: boolean;
}

export function BrainDumpBar({
	onDeconstructAndAdd,
	isLoading,
}: BrainDumpBarProps) {
	const [text, setText] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!text.trim() || isLoading) return;
		const content = text.trim();
		setText("");
		await onDeconstructAndAdd(content);
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="relative flex items-center rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm focus-within:border-amber-500 dark:focus-within:border-amber-500 transition-colors p-1.5"
		>
			<div className="pl-3 pr-2 text-slate-400">
				<Sparkles className="w-5 h-5 text-amber-500" />
			</div>

			<Input
				type="text"
				placeholder="Dump an overwhelming thought, idea, or task..."
				value={text}
				onChange={(e) => setText(e.target.value)}
				disabled={isLoading}
				className="flex-1 border-0 shadow-none focus-visible:ring-0 text-base placeholder:text-slate-400 px-1"
			/>

			<Button
				type="submit"
				disabled={!text.trim() || isLoading}
				className="rounded-xl px-5 bg-amber-600 hover:bg-amber-500 text-white font-medium shrink-0 shadow-sm"
			>
				{isLoading ? (
					<>
						<Loader2 className="w-4 h-4 mr-2 animate-spin" />
						Untangling...
					</>
				) : (
					<>
						<Plus className="w-4 h-4 mr-1.5" />
						Untangle & Add
					</>
				)}
			</Button>
		</form>
	);
}
