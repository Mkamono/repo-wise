import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DirectoryExplorer } from "../../components/DirectoryExplorer";

export const Route = createFileRoute("/browse/")({
	component: BrowseIndexApp,
});

function BrowseIndexApp() {
	const navigate = useNavigate();

	const handleDirectorySelect = (path: string) => {
		navigate({
			to: "/browse/$path",
			params: { path: encodeURIComponent(path) },
			search: {},
		});
	};

	return (
		<>
			<div className="p-4 border-b border-gray-600">
				<h1 className="text-2xl font-bold text-white">Browse Directories</h1>
			</div>
			<div className="flex-1 overflow-hidden">
				<DirectoryExplorer onDirectorySelect={handleDirectorySelect} />
			</div>
		</>
	);
}
