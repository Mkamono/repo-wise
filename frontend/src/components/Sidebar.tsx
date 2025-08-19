import { useCallback, useEffect, useState } from "react";
import { type Document, getDocuments } from "../../backend";

interface FileItem {
	name: string;
	path: string;
	type: "file" | "folder";
	children?: FileItem[];
}

// Build file tree from flat document list relative to selected directory
function buildFileTree(
	documents: Document[],
	selectedDirectory?: string,
): FileItem[] {
	const tree: FileItem[] = [];
	const folderMap = new Map<string, FileItem>();

	for (const doc of documents) {
		let relativePath = doc.path;

		// Remove the selected directory from the path to make it relative
		if (selectedDirectory && doc.path.startsWith(selectedDirectory)) {
			relativePath = doc.path.substring(selectedDirectory.length);
			if (relativePath.startsWith("/")) {
				relativePath = relativePath.substring(1);
			}
		}

		// Skip if path is empty (file in root of selected directory)
		if (!relativePath) {
			tree.push({
				name: doc.name,
				path: doc.path,
				type: "file",
			});
			continue;
		}

		const pathParts = relativePath.split("/").filter((part) => part.length > 0);
		let currentLevel = tree;
		let currentPath = selectedDirectory || "";

		// Create folders for all path parts except the last one (which is the file)
		for (let i = 0; i < pathParts.length - 1; i++) {
			const folderName = pathParts[i];
			currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

			let folder = currentLevel.find(
				(item) => item.name === folderName && item.type === "folder",
			);
			if (!folder) {
				folder = {
					name: folderName,
					path: currentPath,
					type: "folder",
					children: [],
				};
				currentLevel.push(folder);
				folderMap.set(currentPath, folder);
			}
			currentLevel = folder.children || [];
		}

		// Add the file
		const fileName = pathParts[pathParts.length - 1] || doc.name;
		const filePath = selectedDirectory
			? `${selectedDirectory}/${relativePath}`
			: doc.path;
		currentLevel.push({
			name: fileName,
			path: filePath,
			type: "file",
		});
	}

	return tree;
}

interface FileTreeProps {
	items: FileItem[];
	onFileSelect: (path: string) => void;
	activeFile?: string | null;
	level?: number;
}

function FileTree({
	items,
	onFileSelect,
	activeFile,
	level = 0,
}: FileTreeProps) {
	// Initialize with all folders expanded
	const getAllFolderPaths = useCallback((items: FileItem[]): string[] => {
		const paths: string[] = [];
		for (const item of items) {
			if (item.type === "folder") {
				paths.push(item.path);
				if (item.children) {
					paths.push(...getAllFolderPaths(item.children));
				}
			}
		}
		return paths;
	}, []);

	const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
		() => new Set(getAllFolderPaths(items)),
	);

	// Update expanded folders when items change
	useEffect(() => {
		setExpandedFolders(new Set(getAllFolderPaths(items)));
	}, [items, getAllFolderPaths]);

	const toggleFolder = (path: string) => {
		const newExpanded = new Set(expandedFolders);
		if (newExpanded.has(path)) {
			newExpanded.delete(path);
		} else {
			newExpanded.add(path);
		}
		setExpandedFolders(newExpanded);
	};

	return (
		<div>
			{items.map((item) => (
				<div key={item.path} className="select-none">
					<button
						type="button"
						className={`flex items-center py-1 px-2 cursor-pointer w-full text-left ${
							item.type === "file" && activeFile === item.path
								? "bg-indigo-600 text-white"
								: "hover:bg-gray-700"
						}`}
						style={{ paddingLeft: `${level * 16 + 8}px` }}
						onClick={() =>
							item.type === "folder"
								? toggleFolder(item.path)
								: onFileSelect(item.path)
						}
					>
						{item.type === "folder" && (
							<span className="mr-1 text-gray-400">
								{expandedFolders.has(item.path) ? "▼" : "▶"}
							</span>
						)}
						<span
							className={`text-sm ${
								item.type === "file" && activeFile === item.path
									? "text-white font-medium"
									: "text-gray-200"
							}`}
						>
							{item.name}
						</span>
					</button>
					{item.type === "folder" &&
						expandedFolders.has(item.path) &&
						item.children && (
							<FileTree
								items={item.children}
								onFileSelect={onFileSelect}
								activeFile={activeFile}
								level={level + 1}
							/>
						)}
				</div>
			))}
		</div>
	);
}

interface SidebarProps {
	onFileSelect: (path: string) => void;
	selectedDirectory?: string;
	activeFile?: string | null;
	onDirectorySelect?: () => void;
}

export function Sidebar({
	onFileSelect,
	selectedDirectory,
	activeFile,
	onDirectorySelect,
}: SidebarProps) {
	const [documents, setDocuments] = useState<Document[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchDocuments = useCallback(async (path?: string) => {
		if (!path) return;

		try {
			setLoading(true);
			const response = await getDocuments({ path, kind: "local" });
			setDocuments(response.data.documents || []);
			setError(null);
		} catch (err) {
			console.error("Failed to fetch documents:", err);
			setError("Failed to load documents");
			setDocuments([]);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (selectedDirectory) {
			fetchDocuments(selectedDirectory);
		}
	}, [selectedDirectory, fetchDocuments]);

	const fileTree = buildFileTree(documents, selectedDirectory);

	return (
		<div className="w-64 bg-gray-800 border-r border-gray-600 h-full overflow-y-auto">
			<div className="p-3 border-b border-gray-600">
				<div className="flex items-center justify-between">
					<h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">
						Documents
					</h2>
					<button
						type="button"
						onClick={onDirectorySelect}
						className="text-gray-400 hover:text-gray-200 text-sm"
						title="Change directory"
					>
						📁
					</button>
				</div>
				{selectedDirectory && (
					<div className="text-xs text-gray-400 mt-1 break-all">
						{selectedDirectory}
					</div>
				)}
			</div>
			<div className="p-2">
				{!selectedDirectory && (
					<div className="text-gray-400 text-sm p-2">
						<button
							type="button"
							onClick={onDirectorySelect}
							className="text-blue-400 hover:text-blue-300 underline"
						>
							Select a directory
						</button>{" "}
						to browse documents
					</div>
				)}
				{selectedDirectory && loading && (
					<div className="text-gray-400 text-sm p-2">Loading documents...</div>
				)}
				{selectedDirectory && error && (
					<div className="text-red-400 text-sm p-2">{error}</div>
				)}
				{selectedDirectory && !loading && !error && documents.length === 0 && (
					<div className="text-gray-400 text-sm p-2">No documents found</div>
				)}
				{selectedDirectory && !loading && !error && documents.length > 0 && (
					<FileTree
						items={fileTree}
						onFileSelect={onFileSelect}
						activeFile={activeFile}
					/>
				)}
			</div>
		</div>
	);
}
