import { useCallback, useEffect, useMemo, useState } from "react";
import { useGetDocuments, usePostDocument } from "../api/backend";
import type { Document } from "../api/model";

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

		const pathParts = relativePath
			.split("/")
			.filter((part: string) => part.length > 0);
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

	return collapseSingleChildDirectories(tree);
}

// Collapse single-child directories into a single path (e.g., "dir1/dir2/dir3")
function collapseSingleChildDirectories(items: FileItem[]): FileItem[] {
	return items.map((item) => {
		if (item.type === "folder" && item.children) {
			// Recursively process children first
			const processedChildren = collapseSingleChildDirectories(item.children);

			// Check if this folder has only one child and that child is also a folder
			if (
				processedChildren.length === 1 &&
				processedChildren[0].type === "folder"
			) {
				const childFolder = processedChildren[0];
				// Collapse this folder with its child
				return {
					...childFolder,
					name: `${item.name}/${childFolder.name}`,
					// Keep the parent's path for navigation
					path: item.path,
				};
			}

			// Return folder with processed children
			return {
				...item,
				children: processedChildren,
			};
		}

		return item;
	});
}

interface FileTreeProps {
	items: FileItem[];
	onFileSelect: (path: string) => void;
	activeFile?: string | null;
	level?: number;
	onCreateFileInFolder?: (folderPath: string) => void;
	createFileInFolder?: string | null;
	onCancelCreateFile?: () => void;
	onCreateFile?: (folderPath: string, fileName: string) => Promise<void>;
	onNavigateToDirectory?: (path: string) => void;
}

function FileTree({
	items,
	onFileSelect,
	activeFile,
	level = 0,
	onCreateFileInFolder,
	createFileInFolder,
	onCancelCreateFile,
	onCreateFile,
	onNavigateToDirectory,
}: FileTreeProps) {
	const [fileName, setFileName] = useState("");
	const [isCreating, setIsCreating] = useState(false);

	// Handle inline file creation
	const handleSubmitFileName = async (
		e: React.FormEvent,
		folderPath: string,
	) => {
		e.preventDefault();
		if (!fileName.trim() || !onCreateFile) return;

		setIsCreating(true);
		try {
			await onCreateFile(folderPath, fileName.trim());
			setFileName("");
			onCancelCreateFile?.();
		} catch (error) {
			console.error("Failed to create file:", error);
		} finally {
			setIsCreating(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			setFileName("");
			onCancelCreateFile?.();
		}
	};

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

	// Update expanded folders when items change, but preserve user's toggle state
	useEffect(() => {
		const currentAllFolderPaths = getAllFolderPaths(items);
		setExpandedFolders((prev) => {
			// Only add new folders that don't exist in the current expanded set
			const newSet = new Set(prev);
			for (const path of currentAllFolderPaths) {
				if (!prev.has(path)) {
					newSet.add(path);
				}
			}
			// Remove folders that no longer exist in the file tree
			const currentPathsSet = new Set(currentAllFolderPaths);
			for (const path of Array.from(prev)) {
				if (!currentPathsSet.has(path)) {
					newSet.delete(path);
				}
			}
			return newSet;
		});
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
					<div
						className={`flex items-center group ${
							item.type === "file" && activeFile === item.path
								? "bg-indigo-600 text-white"
								: "hover:bg-gray-700"
						}`}
					>
						<button
							type="button"
							className="flex items-center py-1 px-2 cursor-pointer flex-1 text-left"
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
						{item.type === "folder" && (
							<div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
								{onCreateFileInFolder && (
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											onCreateFileInFolder(item.path);
										}}
										className="text-gray-400 hover:text-gray-200 cursor-pointer px-1 py-1 text-xs"
										title={`Create file in ${item.name}`}
									>
										➕
									</button>
								)}
								{onNavigateToDirectory && (
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											onNavigateToDirectory(item.path);
										}}
										className="text-gray-400 hover:text-gray-200 cursor-pointer px-1 py-1 text-xs"
										title={`Navigate to ${item.name} directory`}
									>
										📁
									</button>
								)}
							</div>
						)}
					</div>
					{item.type === "folder" && expandedFolders.has(item.path) && (
						<>
							{createFileInFolder === item.path && (
								<form
									onSubmit={(e) => handleSubmitFileName(e, item.path)}
									className="ml-4"
									style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
								>
									<input
										type="text"
										value={fileName}
										onChange={(e) => setFileName(e.target.value)}
										onKeyDown={handleKeyDown}
										onBlur={() => {
											if (!fileName.trim()) {
												onCancelCreateFile?.();
											}
										}}
										placeholder="Enter file name..."
										className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
										disabled={isCreating}
									/>
								</form>
							)}
							{item.children && (
								<FileTree
									items={item.children}
									onFileSelect={onFileSelect}
									activeFile={activeFile}
									level={level + 1}
									onCreateFileInFolder={onCreateFileInFolder}
									createFileInFolder={createFileInFolder}
									onCancelCreateFile={onCancelCreateFile}
									onCreateFile={onCreateFile}
									onNavigateToDirectory={onNavigateToDirectory}
								/>
							)}
						</>
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
	onNavigateToDirectory?: (path: string) => void;
}

interface SidebarWithDocumentsProps extends SidebarProps {
	documents?: { documents: Document[] | null } | null;
}

export function Sidebar({
	onFileSelect,
	selectedDirectory,
	activeFile,
	onDirectorySelect,
	onNavigateToDirectory,
	documents: documentsData,
}: SidebarWithDocumentsProps) {
	const [createFileInFolder, setCreateFileInFolder] = useState<string | null>(
		null,
	);

	// Fallback to SWR if no documents provided via props (for compatibility)
	const {
		data: documentsResponse,
		error,
		isLoading,
		mutate: refetchDocuments,
	} = useGetDocuments(
		!documentsData && selectedDirectory
			? { path: selectedDirectory, kind: "local" }
			: undefined,
		{
			swr: {
				enabled: !!(!documentsData && selectedDirectory),
				revalidateOnFocus: false,
				dedupingInterval: 30000,
			},
		},
	);

	const { trigger: createDocument } = usePostDocument();

	const documents =
		(documentsData?.documents && Array.isArray(documentsData.documents)
			? documentsData.documents
			: []) ||
		(documentsResponse?.data.documents &&
		Array.isArray(documentsResponse.data.documents)
			? documentsResponse.data.documents
			: []);
	const fileTree = useMemo(
		() => buildFileTree(documents, selectedDirectory),
		[documents, selectedDirectory],
	);

	const handleFileCreated = async (filePath: string) => {
		// Refresh the documents list
		await refetchDocuments();
		// Auto-select the newly created file
		onFileSelect(filePath);
	};

	const handleCreateFileInFolder = (folderPath: string) => {
		setCreateFileInFolder(folderPath);
	};

	const handleCancelCreateFile = () => {
		setCreateFileInFolder(null);
	};

	const handleCreateFile = async (folderPath: string, fileName: string) => {
		// Ensure file ends with .md extension
		const fileNameWithExtension = fileName.endsWith(".md")
			? fileName
			: `${fileName}.md`;
		const filePath = `${folderPath}/${fileNameWithExtension}`;

		const result = await createDocument({
			path: filePath,
			kind: "local",
		});

		if (result.data.success) {
			await handleFileCreated(result.data.path);
		} else {
			throw new Error("Failed to create file");
		}
	};

	return (
		<div className="w-64 bg-gray-800 border-r border-gray-600 h-full overflow-y-auto">
			<div className="p-3 border-b border-gray-600">
				<div className="flex items-center justify-between">
					<h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">
						Documents
					</h2>
					<div className="flex items-center space-x-2">
						{selectedDirectory && (
							<button
								type="button"
								onClick={() => handleCreateFileInFolder(selectedDirectory)}
								className="text-gray-400 hover:text-gray-200 cursor-pointer text-sm"
								title="Create new file"
							>
								➕
							</button>
						)}
						<button
							type="button"
							onClick={onDirectorySelect}
							className="text-gray-400 hover:text-gray-200 cursor-pointer text-sm"
							title="Change directory"
						>
							📁
						</button>
					</div>
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
							className="text-blue-400 hover:text-blue-300 cursor-pointer underline"
						>
							Select a directory
						</button>{" "}
						to browse documents
					</div>
				)}
				{selectedDirectory && isLoading && (
					<div className="text-gray-400 text-sm p-2">Loading documents...</div>
				)}
				{selectedDirectory && error && (
					<div className="text-red-400 text-sm p-2">
						Failed to load documents
					</div>
				)}
				{selectedDirectory &&
					!isLoading &&
					!error &&
					documents.length === 0 && (
						<div className="text-gray-400 text-sm p-2">No documents found</div>
					)}
				{selectedDirectory && !isLoading && !error && documents.length > 0 && (
					<FileTree
						items={fileTree}
						onFileSelect={onFileSelect}
						activeFile={activeFile}
						onCreateFileInFolder={handleCreateFileInFolder}
						createFileInFolder={createFileInFolder}
						onCancelCreateFile={handleCancelCreateFile}
						onCreateFile={handleCreateFile}
						onNavigateToDirectory={onNavigateToDirectory}
					/>
				)}
			</div>
		</div>
	);
}
