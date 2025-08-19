import { useCallback, useEffect, useState } from "react";
import { type FileInfo, getDirectory } from "../../backend";

interface DirectorySelectionDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onDirectorySelect: (path: string) => void;
	selectedDirectory?: string;
	initialPath?: string;
}

export function DirectorySelectionDialog({
	isOpen,
	onClose,
	onDirectorySelect,
	selectedDirectory,
	initialPath = "/Users",
}: DirectorySelectionDialogProps) {
	const [currentPath, setCurrentPath] = useState(initialPath);
	const [items, setItems] = useState<FileInfo[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

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
		if (isOpen) {
			loadDirectory(currentPath);
		}
	}, [isOpen, currentPath, loadDirectory]);

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
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-gray-800 rounded-lg shadow-xl w-[600px] h-[500px] flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-gray-600">
					<div className="flex items-center">
						<span className="mr-3 text-lg">📁</span>
						<h2 className="text-lg font-semibold text-gray-200">
							Select Directory
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="text-gray-400 hover:text-gray-200 text-xl"
					>
						×
					</button>
				</div>

				{/* Current Path Controls */}
				<div className="p-4 border-b border-gray-600">
					<div className="flex items-center gap-2 mb-3">
						<input
							type="text"
							value={currentPath}
							onChange={(e) => setCurrentPath(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && loadDirectory(currentPath)}
							className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
							placeholder="/absolute/path/to/directory"
						/>
						<button
							type="button"
							onClick={() => loadDirectory(currentPath)}
							disabled={loading}
							className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md font-medium disabled:opacity-50 text-sm"
						>
							{loading ? "..." : "Go"}
						</button>
						<button
							type="button"
							onClick={goUp}
							disabled={currentPath === "/"}
							className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-2 rounded-md disabled:opacity-50 text-sm"
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
					<div className="flex flex-wrap gap-1">
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
				</div>

				{/* Directory Contents */}
				<div className="flex-1 overflow-y-auto bg-gray-700 mx-4 rounded border border-gray-600">
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
								.filter((item) => item.is_dir) // Only show directories
								.sort((a, b) => a.name.localeCompare(b.name))
								.map((item) => (
									<button
										key={item.name}
										type="button"
										className="flex items-center p-3 hover:bg-gray-600 cursor-pointer w-full text-left"
										onClick={() => handleDirectoryClick(item.name)}
									>
										<span className="mr-3 text-lg">📁</span>
										<span className="font-medium flex-1 text-blue-400">
											{item.name}
										</span>
									</button>
								))}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="p-4 border-t border-gray-600 flex items-center justify-between">
					<div className="text-sm text-gray-300">
						{selectedDirectory && (
							<span>
								Current:{" "}
								<code className="bg-gray-700 px-1 rounded text-gray-200">
									{selectedDirectory}
								</code>
							</span>
						)}
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={onClose}
							className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleSelectDirectory}
							className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
						>
							Select Directory
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
