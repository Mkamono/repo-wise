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

	const [activeFile, setActiveFile] = useState<string | null>(file || null);
	const [selectedDirectory, setSelectedDirectory] = useState<
		string | undefined
	>(directory);
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
		setActiveFile(filePath);
		updateURL(selectedDirectory, filePath);
	};

	// Handle directory selection with URL update
	const handleDirectorySelect = (directoryPath: string) => {
		setSelectedDirectory(directoryPath);
		setShowDirectoryDialog(false);
		// Clear active file when directory changes
		setActiveFile(null);
		updateURL(directoryPath, undefined);
	};

	// Sync state with URL changes (for browser back/forward)
	useEffect(() => {
		if (directory !== selectedDirectory) {
			setSelectedDirectory(directory);
			setShowDirectoryDialog(!directory);
		}
		if (file !== activeFile) {
			setActiveFile(file || null);
		}
	}, [directory, file, selectedDirectory, activeFile]);

	return (
		<div className="h-screen flex flex-col bg-gray-900">
			<Header
				onDirectorySelect={() => setShowDirectoryDialog(true)}
				selectedDirectory={selectedDirectory}
				activeFile={activeFile}
			/>
			<div className="flex flex-1 overflow-hidden">
				<Sidebar
					onFileSelect={handleFileSelect}
					selectedDirectory={selectedDirectory}
					activeFile={activeFile}
					onDirectorySelect={() => setShowDirectoryDialog(true)}
				/>
				<Editor activeFile={activeFile} />
			</div>

			<DirectorySelectionDialog
				isOpen={showDirectoryDialog}
				onClose={() => setShowDirectoryDialog(false)}
				onDirectorySelect={handleDirectorySelect}
				selectedDirectory={selectedDirectory}
			/>
		</div>
	);
}
