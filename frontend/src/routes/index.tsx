import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DirectorySelectionDialog } from "../components/DirectorySelectionDialog";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	const navigate = useNavigate();
	const [showDirectoryDialog, setShowDirectoryDialog] = useState(true);

	// Handle directory selection with navigation to browse route
	const handleDirectorySelect = (directoryPath: string) => {
		setShowDirectoryDialog(false);
		const encodedPath = encodeURIComponent(directoryPath);
		navigate({
			to: "/browse/$path",
			params: { path: encodedPath },
			search: { file: undefined },
		});
	};

	return (
		<div className="h-screen flex flex-col bg-gray-900 items-center justify-center">
			<div className="text-center mb-8">
				<h1 className="text-4xl font-bold text-white mb-4">📁 File Browser</h1>
				<p className="text-gray-400 text-lg">
					Select a directory to get started
				</p>
			</div>

			<DirectorySelectionDialog
				isOpen={showDirectoryDialog}
				onClose={() => setShowDirectoryDialog(false)}
				onDirectorySelect={handleDirectorySelect}
			/>
		</div>
	);
}
