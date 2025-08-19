interface HeaderProps {
	onDirectorySelect?: () => void;
	selectedDirectory?: string;
	activeFile?: string | null;
}

export function Header({
	onDirectorySelect,
	selectedDirectory,
	activeFile,
}: HeaderProps) {
	return (
		<header className="bg-gray-900 border-b border-gray-600 text-white px-4 py-2">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<h1 className="text-lg font-semibold">Document Editor</h1>
					<nav className="flex space-x-4 text-sm">
						<button
							type="button"
							onClick={onDirectorySelect}
							className="hover:bg-gray-700 px-2 py-1 rounded flex items-center gap-1"
						>
							📁 Directory
						</button>
					</nav>
				</div>
				<div className="flex items-center space-x-2 text-sm text-gray-300">
					{/* Breadcrumb navigation */}
					{selectedDirectory && (
						<div className="flex items-center space-x-1">
							<span className="text-xs text-gray-400">📁</span>
							<span className="bg-gray-700 px-2 py-1 rounded text-xs font-mono">
								{selectedDirectory}
							</span>
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
