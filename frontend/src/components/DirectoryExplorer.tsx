import { useCallback, useEffect, useState } from "react";
import { type FileInfo, getDirectory } from "../../backend";

interface DirectoryExplorerProps {
	onDirectorySelect: (path: string) => void;
	selectedDirectory?: string;
	currentPath?: string;
	onPathChange?: (path: string) => void;
}

export function DirectoryExplorer({
	onDirectorySelect,
	selectedDirectory,
	currentPath = "/Users",
	onPathChange,
}: DirectoryExplorerProps) {
	const [items, setItems] = useState<FileInfo[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadDirectory = useCallback(
		async (path: string) => {
			if (!path.trim()) return;

			setLoading(true);
			setError(null);

			try {
				const response = await getDirectory({ path, kind: "local" });
				setItems(response.data.items || []);
				onPathChange?.(path);
			} catch (err) {
				console.error("Failed to load directory:", err);
				setError("Failed to load directory");
				setItems([]);
			} finally {
				setLoading(false);
			}
		},
		[onPathChange],
	);

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
		onDirectorySelect(currentPath);
	};

	const getFileIcon = (name: string, isDir: boolean) => {
		if (isDir) return "📁";

		const extension = name.split(".").pop()?.toLowerCase();
		const iconMap: Record<string, string> = {
			md: "📝",
			txt: "📄",
			json: "📋",
			js: "📄",
			ts: "📄",
			py: "🐍",
			go: "🔷",
		};
		return iconMap[extension || ""] || "📄";
	};

	return (
		<div className="bg-gray-800 h-full p-4">
			<div className="flex items-center mb-4 border-b border-gray-600 pb-3">
				<span className="mr-3 text-lg">📁</span>
				<h2 className="text-lg font-semibold text-gray-200">
					Directory Explorer
				</h2>
			</div>

			{/* Current Path and Controls */}
			<div className="mb-4">
				<label
					htmlFor="directory-input"
					className="block text-sm font-medium text-gray-300 mb-2"
				>
					Current Directory
				</label>
				<div className="flex items-center gap-2 mb-2">
					<input
						id="directory-input"
						type="text"
						value={currentPath}
						onChange={(e) => onPathChange?.(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && loadDirectory(currentPath)}
						className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="/absolute/path/to/directory"
					/>
					<button
						type="button"
						onClick={() => loadDirectory(currentPath)}
						disabled={loading}
						className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
					>
						{loading ? "..." : "Go"}
					</button>
					<button
						type="button"
						onClick={goUp}
						disabled={currentPath === "/"}
						className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md disabled:opacity-50"
						title="Go up one level"
					>
						↑
					</button>
				</div>

				{/* Breadcrumb */}
				<nav className="flex items-center space-x-1 text-sm text-gray-400 mb-3">
					<button
						type="button"
						onClick={() => navigateToPath("/")}
						className="hover:text-blue-400 font-medium"
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
												: "hover:text-blue-400"
										}
									>
										{part}
									</button>
								</span>
							);
						})}
				</nav>

				{/* Quick Navigation */}
				<div className="flex flex-wrap gap-2 mb-4">
					<button
						type="button"
						onClick={() => navigateToPath("/")}
						className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-xs"
					>
						Root
					</button>
					<button
						type="button"
						onClick={() => navigateToPath("/Users")}
						className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-xs"
					>
						Users
					</button>
					<button
						type="button"
						onClick={() => navigateToPath("/home")}
						className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-xs"
					>
						Home
					</button>
					<button
						type="button"
						onClick={() => navigateToPath("/tmp")}
						className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-xs"
					>
						Temp
					</button>
				</div>

				{/* Select Directory Button */}
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={handleSelectDirectory}
						className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
					>
						Use This Directory for Documents
					</button>
					{selectedDirectory && (
						<span className="text-sm text-gray-300">
							Selected:{" "}
							<code className="bg-gray-700 px-1 rounded text-gray-200">
								{selectedDirectory}
							</code>
						</span>
					)}
				</div>
			</div>

			{/* Directory Contents */}
			<div className="border border-gray-600 rounded-md max-h-96 overflow-y-auto bg-gray-700">
				{loading && (
					<div className="p-4 text-center text-gray-400">Loading...</div>
				)}

				{error && <div className="p-4 text-center text-red-400">{error}</div>}

				{!loading && !error && items.length === 0 && (
					<div className="p-4 text-center text-gray-400">Empty directory</div>
				)}

				{!loading && !error && items.length > 0 && (
					<div className="divide-y divide-gray-600">
						{items
							.sort((a, b) => {
								// Directories first, then alphabetical
								if (a.is_dir && !b.is_dir) return -1;
								if (!a.is_dir && b.is_dir) return 1;
								return a.name.localeCompare(b.name);
							})
							.map((item) => (
								<div
									key={item.name}
									className={`flex items-center p-3 hover:bg-gray-600 cursor-pointer ${
										item.is_dir ? "hover:bg-gray-600" : ""
									}`}
									onClick={() => item.is_dir && handleDirectoryClick(item.name)}
									onKeyDown={(e) => {
										if ((e.key === "Enter" || e.key === " ") && item.is_dir) {
											e.preventDefault();
											handleDirectoryClick(item.name);
										}
									}}
									tabIndex={item.is_dir ? 0 : undefined}
									role={item.is_dir ? "button" : undefined}
								>
									<span className="mr-3 text-lg">
										{getFileIcon(item.name, item.is_dir)}
									</span>
									<span
										className={`font-medium flex-1 ${
											item.is_dir ? "text-blue-400" : "text-gray-300"
										}`}
									>
										{item.name}
									</span>
									<span className="text-sm text-gray-400">
										{item.is_dir ? "Directory" : "File"}
									</span>
								</div>
							))}
					</div>
				)}
			</div>
		</div>
	);
}
