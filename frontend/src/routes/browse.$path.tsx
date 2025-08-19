import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { DirectorySelectionDialog } from "../components/DirectorySelectionDialog";
import { Editor } from "../components/Editor";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";

const browseSearchSchema = z.object({
	file: z.string().optional(),
});

type BrowseSearch = z.infer<typeof browseSearchSchema>;

export const Route = createFileRoute("/browse/$path")({
	validateSearch: (search: Record<string, unknown>): BrowseSearch => {
		try {
			return browseSearchSchema.parse(search);
		} catch {
			return { file: undefined };
		}
	},
	component: BrowseApp,
});

function BrowseApp() {
	const navigate = useNavigate();
	const { path: directoryPath } = Route.useParams();
	const { file } = Route.useSearch();

	// Decode the directory path from URL
	const directory = directoryPath
		? decodeURIComponent(directoryPath)
		: undefined;

	const [showDirectoryDialog, setShowDirectoryDialog] = useState(false);

	// Handle file selection with URL update
	const handleFileSelect = (filePath: string) => {
		navigate({
			to: ".",
			search: (prev) => ({ ...prev, file: filePath }),
			replace: true,
		});
	};

	// Handle directory selection with URL update
	const handleDirectorySelect = (newDirectoryPath: string) => {
		setShowDirectoryDialog(false);
		const encodedPath = encodeURIComponent(newDirectoryPath);
		navigate({
			to: "/browse/$path",
			params: { path: encodedPath },
			search: {},
		});
	};

	return (
		<>
			<Header
				onDirectorySelect={() => setShowDirectoryDialog(true)}
				selectedDirectory={directory}
				activeFile={file}
			/>
			<div className="flex flex-1 overflow-hidden">
				<Sidebar
					onFileSelect={handleFileSelect}
					selectedDirectory={directory}
					activeFile={file}
					onDirectorySelect={() => setShowDirectoryDialog(true)}
				/>
				<Editor activeFile={file || null} />
			</div>

			<DirectorySelectionDialog
				isOpen={showDirectoryDialog}
				onClose={() => setShowDirectoryDialog(false)}
				onDirectorySelect={handleDirectorySelect}
				selectedDirectory={directory}
			/>
		</>
	);
}
