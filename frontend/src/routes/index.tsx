import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DirectorySelectionDialog } from "../components/DirectorySelectionDialog";
import { Editor } from "../components/Editor";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";

// Define search schema for query parameters
export const Route = createFileRoute("/")({
	validateSearch: (search: Record<string, unknown>) => {
		return {
			directory: (search.directory as string) || undefined,
			file: (search.file as string) || undefined,
		};
	},
	component: App,
});

function App() {
	const navigate = useNavigate();
	const { directory, file } = Route.useSearch();

	const [showDirectoryDialog, setShowDirectoryDialog] = useState(!directory);

	// Update URL when directory or file changes
	const updateURL = (newDirectory?: string, newFile?: string) => {
		navigate({
			to: "/",
			search: {
				directory: newDirectory,
				file: newFile,
			},
		});
	};

	// Handle file selection with URL update
	const handleFileSelect = (filePath: string) => {
		updateURL(directory, filePath);
	};

	// Handle directory selection with URL update
	const handleDirectorySelect = (directoryPath: string) => {
		setShowDirectoryDialog(false);
		// Clear active file when directory changes
		updateURL(directoryPath, undefined);
	};

	// Sync dialog state with URL changes (for browser back/forward)
	useEffect(() => {
		setShowDirectoryDialog(!directory);
	}, [directory]);

	return (
		<div className="h-screen flex flex-col bg-gray-900">
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
		</div>
	);
}
