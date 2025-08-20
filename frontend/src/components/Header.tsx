interface HeaderProps {
	onDirectorySelect?: () => void;
	selectedDirectory?: string;
	activeFile?: string | null;
	onToggleFavorite?: () => void;
	isUpdatingFavorite?: boolean;
	isFavorite?: boolean;
	canToggleFavorite?: boolean;
	onNavigateToDirectory?: (path: string) => void;
}

export function Header({
	onDirectorySelect,
	selectedDirectory,
	activeFile,
	onToggleFavorite,
	isUpdatingFavorite,
	isFavorite,
	canToggleFavorite,
	onNavigateToDirectory,
}: HeaderProps) {
	// Generate breadcrumb paths from the selected directory
	const generateBreadcrumbs = (path: string) => {
		const parts = path.split("/").filter(Boolean);
		const breadcrumbs = [];

		// Add root
		breadcrumbs.push({ label: "/", path: "/" });

		// Add each directory level
		let currentPath = "";
		for (const part of parts) {
			currentPath += `/${part}`;
			breadcrumbs.push({ label: part, path: currentPath });
		}

		return breadcrumbs;
	};
	return (
		<header className="bg-gray-900 border-b border-gray-600 text-white px-4 py-2">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<h1 className="text-lg font-semibold">Document Editor</h1>
					<nav className="flex space-x-4 text-sm">
						<button
							type="button"
							onClick={onDirectorySelect}
							className="hover:bg-gray-700 cursor-pointer px-2 py-1 rounded flex items-center gap-1"
							title="Change directory"
						>
							<span className="text-lg">➕</span> Change Directory
						</button>
						{onToggleFavorite && (
							<button
								type="button"
								onClick={onToggleFavorite}
								disabled={isUpdatingFavorite || !canToggleFavorite}
								className="hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer px-2 py-1 rounded flex items-center gap-1"
								title={
									isFavorite ? "Remove from favorites" : "Add to favorites"
								}
							>
								{isFavorite ? "⭐" : "☆"} {isFavorite ? "Remove" : "Add"}
							</button>
						)}
					</nav>
				</div>
				<div className="flex items-center space-x-2 text-sm text-gray-300">
					{/* Breadcrumb navigation */}
					{selectedDirectory && onNavigateToDirectory && (
						<div className="flex items-center space-x-1">
							<span className="text-xs text-gray-400">📁</span>
							<div className="flex items-center">
								{generateBreadcrumbs(selectedDirectory).map(
									(breadcrumb, index, array) => (
										<div key={breadcrumb.path} className="flex items-center">
											<button
												type="button"
												onClick={() => onNavigateToDirectory(breadcrumb.path)}
												className="bg-gray-700 hover:bg-gray-600 cursor-pointer px-2 py-1 rounded text-xs font-mono transition-colors"
												title={`Navigate to ${breadcrumb.path}`}
											>
												{breadcrumb.label}
											</button>
											{index < array.length - 1 && (
												<span className="text-xs text-gray-500 mx-1">/</span>
											)}
										</div>
									),
								)}
							</div>
						</div>
					)}
					{activeFile && (
						<div className="flex items-center space-x-1">
							<span className="text-xs text-gray-400">→</span>
							<span className="text-xs text-gray-400">📄</span>
							<span className="bg-indigo-600 px-2 py-1 rounded text-xs font-mono">
								{activeFile.split("/").pop() || activeFile}
							</span>
						</div>
					)}
				</div>
			</div>
		</header>
	);
}
