import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { getAppconfig, getDocuments, usePutAppconfig } from "../api/backend";
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
	loader: async ({ params }) => {
		const directory = params.path ? decodeURIComponent(params.path) : undefined;

		// Load app config and documents in parallel
		const [appConfigResponse, documentsResponse] = await Promise.all([
			getAppconfig(),
			directory
				? getDocuments({ path: directory, kind: "local" })
				: Promise.resolve(null),
		]);

		return {
			appConfig: appConfigResponse.data,
			documents: documentsResponse?.data || null,
			directory,
		};
	},
	staleTime: 30_000, // Consider data fresh for 30 seconds
	component: BrowseApp,
});

function BrowseApp() {
	const navigate = useNavigate();
	const { path: directoryPath } = Route.useParams();
	const { file } = Route.useSearch();
	const { appConfig, documents, directory } = Route.useLoaderData();
	const { trigger: updateConfig, isMutating: isUpdatingConfig } =
		usePutAppconfig();

	// Handle file selection with URL update
	const handleFileSelect = (filePath: string) => {
		navigate({
			to: ".",
			search: (prev) => ({ ...prev, file: filePath }),
			replace: true,
		});
	};

	// Handle directory selection navigation
	const handleDirectorySelectNavigation = () => {
		navigate({
			to: "/select-directory",
			search: { from: `/browse/${directoryPath}` },
		});
	};

	// Handle navigation to specific directory path
	const handleNavigateToDirectory = (path: string) => {
		const encodedPath = encodeURIComponent(path);
		navigate({
			to: `/browse/${encodedPath}`,
		});
	};

	// Handle file deletion
	const handleFileDeleted = () => {
		// Clear the active file and refresh the directory
		navigate({
			to: ".",
			search: (prev) => ({ ...prev, file: undefined }),
			replace: true,
		});
	};

	// Handle adding current directory to favorites
	const handleAddToFavorites = async () => {
		if (!appConfig || !directory) return;

		const currentDirectories = appConfig.LocalFile?.Directories || [];

		// Check if already exists
		if (currentDirectories.includes(directory)) {
			alert("This directory is already in your favorites!");
			return;
		}

		const updatedConfig = {
			...appConfig,
			LocalFile: {
				...appConfig.LocalFile,
				Directories: [...currentDirectories, directory],
			},
		};

		try {
			await updateConfig(updatedConfig);
			// Invalidate and refetch route data
			navigate({ to: ".", replace: true });
			alert("Added to favorites!");
		} catch (error) {
			console.error("Failed to add to favorites:", error);
			alert("Failed to add to favorites");
		}
	};

	const configDirectories = appConfig?.LocalFile?.Directories || [];
	const canAddToFavorites = !!(
		directory && !configDirectories.includes(directory)
	);

	return (
		<>
			<Header
				onDirectorySelect={handleDirectorySelectNavigation}
				selectedDirectory={directory}
				activeFile={file}
				onAddToFavorites={handleAddToFavorites}
				isAddingToFavorites={isUpdatingConfig}
				canAddToFavorites={canAddToFavorites}
				onNavigateToDirectory={handleNavigateToDirectory}
			/>
			<div className="flex flex-1 overflow-hidden">
				<Sidebar
					onFileSelect={handleFileSelect}
					selectedDirectory={directory}
					activeFile={file}
					onDirectorySelect={handleDirectorySelectNavigation}
					onNavigateToDirectory={handleNavigateToDirectory}
					documents={documents}
				/>
				<Editor activeFile={file || null} onFileDeleted={handleFileDeleted} />
			</div>
		</>
	);
}
