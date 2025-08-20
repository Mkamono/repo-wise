import {
	createFileRoute,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { getAppconfig, getDirectory, usePutAppconfig } from "../api/backend";
import type { FileInfo } from "../api/model";

const selectDirectorySearchSchema = z.object({
	from: z.string().optional(),
});

type SelectDirectorySearch = z.infer<typeof selectDirectorySearchSchema>;

export const Route = createFileRoute("/select-directory")({
	validateSearch: (search: Record<string, unknown>): SelectDirectorySearch => {
		try {
			return selectDirectorySearchSchema.parse(search);
		} catch {
			return { from: undefined };
		}
	},
	loader: async () => {
		// Load app config at route level
		const appConfigResponse = await getAppconfig();
		return {
			appConfig: appConfigResponse.data,
		};
	},
	staleTime: 60_000, // Consider config fresh for 1 minute
	component: SelectDirectoryPage,
});

function SelectDirectoryPage() {
	const navigate = useNavigate();
	const router = useRouter();
	const [currentPath, setCurrentPath] = useState("/Users");
	const [items, setItems] = useState<FileInfo[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { appConfig } = Route.useLoaderData();
	const { from } = Route.useSearch();
	const { trigger: updateConfig, isMutating: isUpdatingConfig } =
		usePutAppconfig();

	// Check if we came from a browse page (for showing back button)
	const fromBrowsePage = from?.startsWith("/browse/");

	const loadDirectory = useCallback(async (path: string) => {
		if (!path.trim()) return;

		setLoading(true);
		setError(null);

		try {
			const response = await getDirectory({ path, kind: "local" });
			setItems(response.data.items || []);
			setCurrentPath(path);
		} catch (err) {
			console.error("Failed to load directory:", err);
			setError("Failed to load directory");
			setItems([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadDirectory(currentPath);
	}, [currentPath, loadDirectory]);

	const navigateToPath = (path: string) => {
		const cleanPath = path.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
		loadDirectory(cleanPath);
	};

	const goUp = () => {
		if (currentPath && currentPath !== "/") {
			const parentPath = currentPath.split("/").slice(0, -1).join("/") || "/";
			navigateToPath(parentPath);
		}
	};

	const handleDirectoryClick = (itemName: string) => {
		const newPath =
			currentPath === "/" ? `/${itemName}` : `${currentPath}/${itemName}`;
		navigateToPath(newPath);
	};

	const handleSelectDirectory = () => {
		navigate({
			to: "/browse/$path",
			params: { path: encodeURIComponent(currentPath) },
			search: {},
		});
	};

	const handleQuickAccess = (directoryPath: string) => {
		navigate({
			to: "/browse/$path",
			params: { path: encodeURIComponent(directoryPath) },
			search: {},
		});
	};

	const handleBack = () => {
		router.history.back();
	};

	const handleAddToFavorites = async () => {
		if (!appConfig) return;

		const currentDirectories = appConfig.LocalFile?.Directories || [];

		// Check if already exists
		if (currentDirectories.includes(currentPath)) {
			alert("This directory is already in your favorites!");
			return;
		}

		const updatedConfig = {
			...appConfig,
			LocalFile: {
				...appConfig.LocalFile,
				Directories: [...currentDirectories, currentPath],
			},
		};

		try {
			await updateConfig(updatedConfig);
			// Invalidate and refetch route data
			navigate({ to: ".", replace: true });
		} catch (error) {
			console.error("Failed to add to favorites:", error);
			alert("Failed to add to favorites");
		}
	};

	const handleRemoveFromFavorites = async (pathToRemove: string) => {
		if (!appConfig) return;

		const currentDirectories = appConfig.LocalFile?.Directories || [];
		const updatedDirectories = currentDirectories.filter(
			(dir) => dir !== pathToRemove,
		);

		const updatedConfig = {
			...appConfig,
			LocalFile: {
				...appConfig.LocalFile,
				Directories: updatedDirectories,
			},
		};

		try {
			await updateConfig(updatedConfig);
			// Invalidate and refetch route data
			navigate({ to: ".", replace: true });
		} catch (error) {
			console.error("Failed to remove from favorites:", error);
			alert("Failed to remove from favorites");
		}
	};

	const configDirectories = appConfig?.LocalFile?.Directories || [];

	return (
		<div className="flex-1 flex flex-col bg-gray-900">
			{/* Header */}
			<div className="flex items-center justify-between p-6 border-b border-gray-600">
				<div className="flex items-center">
					<span className="mr-3 text-2xl">📁</span>
					<h1 className="text-2xl font-semibold text-gray-200">
						Select Directory
					</h1>
				</div>
				{fromBrowsePage && (
					<button
						type="button"
						onClick={handleBack}
						className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg cursor-pointer transition-colors"
					>
						← Back
					</button>
				)}
			</div>

			<div className="flex-1 flex flex-col lg:flex-row">
				{/* Quick Access Section */}
				{configDirectories.length > 0 && (
					<div className="lg:w-1/3 p-6 border-b lg:border-b-0 lg:border-r border-gray-600">
						<h2 className="text-xl font-semibold text-white mb-4 flex items-center">
							<span className="mr-2">⚡</span>
							Quick Access
						</h2>
						<div className="space-y-3">
							{configDirectories.map((dir) => (
								<div key={dir} className="flex items-center gap-2">
									<button
										type="button"
										onClick={() => handleQuickAccess(dir)}
										className="flex items-center flex-1 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-left cursor-pointer transition-colors"
									>
										<span className="mr-3 text-2xl">📁</span>
										<div className="flex-1 min-w-0">
											<div className="font-medium text-white truncate">
												{dir.split("/").pop() || dir}
											</div>
											<div className="text-sm text-gray-400 truncate">
												{dir}
											</div>
										</div>
									</button>
									<button
										type="button"
										onClick={() => handleRemoveFromFavorites(dir)}
										className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-800 rounded cursor-pointer transition-colors"
										title="Remove from favorites"
										disabled={isUpdatingConfig}
									>
										🗑️
									</button>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Directory Explorer Section */}
				<div className="flex-1 flex flex-col">
					{/* Current Path Controls */}
					<div className="p-6 border-b border-gray-600">
						<div className="flex items-center gap-3 mb-4">
							<input
								type="text"
								value={currentPath}
								onChange={(e) => setCurrentPath(e.target.value)}
								onKeyDown={(e) =>
									e.key === "Enter" && loadDirectory(currentPath)
								}
								className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="/absolute/path/to/directory"
							/>
							<button
								type="button"
								onClick={() => loadDirectory(currentPath)}
								disabled={loading}
								className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 cursor-pointer"
							>
								{loading ? "..." : "Go"}
							</button>
							<button
								type="button"
								onClick={goUp}
								disabled={currentPath === "/"}
								className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg disabled:opacity-50 cursor-pointer"
								title="Go up one level"
							>
								↑
							</button>
						</div>

						{/* Breadcrumb */}
						<nav className="flex items-center space-x-2 text-gray-400 mb-4">
							<button
								type="button"
								onClick={() => navigateToPath("/")}
								className="hover:text-blue-400 cursor-pointer font-medium"
							>
								/
							</button>
							{currentPath
								.split("/")
								.filter((part) => part.length > 0)
								.map((part, index, breadcrumb) => {
									const path = `/${breadcrumb.slice(0, index + 1).join("/")}`;
									const isLast = index === breadcrumb.length - 1;
									return (
										<span key={path} className="flex items-center">
											<span className="text-gray-500">/</span>
											<button
												type="button"
												onClick={() => navigateToPath(path)}
												className={
													isLast
														? "font-semibold text-gray-200"
														: "hover:text-blue-400 cursor-pointer"
												}
											>
												{part}
											</button>
										</span>
									);
								})}
						</nav>

						{/* Quick Navigation */}
						<div className="flex flex-wrap gap-2">
							<button
								type="button"
								onClick={() => navigateToPath("/")}
								className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-sm cursor-pointer"
							>
								Root
							</button>
							<button
								type="button"
								onClick={() => navigateToPath("/Users")}
								className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-sm cursor-pointer"
							>
								Users
							</button>
							<button
								type="button"
								onClick={() => navigateToPath("/home")}
								className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-sm cursor-pointer"
							>
								Home
							</button>
							<button
								type="button"
								onClick={() => navigateToPath("/tmp")}
								className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-sm cursor-pointer"
							>
								Temp
							</button>
						</div>
					</div>

					{/* Directory Contents */}
					<div className="flex-1 p-6">
						{loading && (
							<div className="text-center text-gray-400 py-8">Loading...</div>
						)}

						{error && (
							<div className="text-center text-red-400 py-8">{error}</div>
						)}

						{!loading && !error && items.length === 0 && (
							<div className="text-center text-gray-400 py-8">
								Empty directory
							</div>
						)}

						{!loading && !error && items.length > 0 && (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
								{items
									.filter((item) => item.is_dir)
									.sort((a, b) => a.name.localeCompare(b.name))
									.map((item) => (
										<button
											key={item.name}
											type="button"
											className="flex items-center p-4 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer text-left transition-colors"
											onClick={() => handleDirectoryClick(item.name)}
										>
											<span className="mr-3 text-xl">📁</span>
											<span className="font-medium text-blue-400 truncate">
												{item.name}
											</span>
										</button>
									))}
							</div>
						)}
					</div>

					{/* Footer */}
					<div className="p-6 border-t border-gray-600 flex items-center justify-between">
						<div className="text-gray-300">
							<span>Current: </span>
							<code className="bg-gray-800 px-2 py-1 rounded text-gray-200">
								{currentPath}
							</code>
						</div>
						<div className="flex gap-3">
							<button
								type="button"
								onClick={handleAddToFavorites}
								disabled={
									isUpdatingConfig || configDirectories.includes(currentPath)
								}
								className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium cursor-pointer transition-colors"
								title={
									configDirectories.includes(currentPath)
										? "Already in favorites"
										: "Add to favorites"
								}
							>
								{configDirectories.includes(currentPath) ? "⭐" : "☆"} Favorite
							</button>
							<button
								type="button"
								onClick={handleSelectDirectory}
								className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium cursor-pointer"
							>
								Select Directory
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
