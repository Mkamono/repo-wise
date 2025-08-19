import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DirectorySelectionDialog } from "../components/DirectorySelectionDialog";
import { Editor } from "../components/Editor";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";

export const Route = createFileRoute("/browse/$path")({
	validateSearch: (search: Record<string, unknown>) => {
		return {
			file: (search.file as string) || undefined,
		};
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
			to: "/browse/$path",
			params: { path: directoryPath },
			search: { file: filePath },
		});
	};

	// Handle directory selection with URL update
	const handleDirectorySelect = (newDirectoryPath: string) => {
		setShowDirectoryDialog(false);
		const encodedPath = encodeURIComponent(newDirectoryPath);
		navigate({
			to: "/browse/$path",
			params: { path: encodedPath },
			search: { file: undefined },
		});
	};

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
