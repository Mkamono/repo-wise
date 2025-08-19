import { createFileRoute } from "@tanstack/react-router";
import { DirectoryExplorer } from "../../components/DirectoryExplorer";

export const Route = createFileRoute("/browse/")({
	component: BrowseIndexApp,
});

function BrowseIndexApp() {
	return (
		<div className="h-screen flex flex-col bg-gray-900">
			<div className="p-4 border-b border-gray-600">
				<h1 className="text-2xl font-bold text-white">Browse Directories</h1>
			</div>
			<div className="flex-1 overflow-hidden">
				<DirectoryExplorer
					onDirectorySelect={(path) => {
						// Navigate to the selected directory path
						window.location.href = `/browse/${encodeURIComponent(path)}`;
					}}
				/>
			</div>
		</div>
	);
}
