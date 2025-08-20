import { useEffect, useState } from "react";
import { useDeleteDocument, useGetDocumentContent } from "../api/backend";

interface EditorProps {
	activeFile: string | null;
	onFileDeleted?: () => void;
}

export function Editor({ activeFile, onFileDeleted }: EditorProps) {
	const [isDirty, setIsDirty] = useState<boolean>(false);
	const [localContent, setLocalContent] = useState<string>("");
	const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);

	const {
		data: contentResponse,
		error,
		isLoading,
	} = useGetDocumentContent(
		activeFile ? { path: activeFile, kind: "local" } : undefined,
		{
			swr: {
				enabled: !!activeFile,
				revalidateOnFocus: false,
				revalidateOnReconnect: false,
			},
		},
	);

	const { trigger: deleteDocument, isMutating: isDeleting } =
		useDeleteDocument();

	useEffect(() => {
		if (contentResponse?.data.content !== undefined) {
			setLocalContent(contentResponse.data.content);
			setIsDirty(false);
		}
	}, [contentResponse]);

	useEffect(() => {
		if (error) {
			console.error("Failed to load document content:", error);
			setLocalContent(
				`Error loading content for ${activeFile}: ${error.message || String(error)}`,
			);
		}
	}, [error, activeFile]);

	useEffect(() => {
		if (!activeFile) {
			setLocalContent("");
			setIsDirty(false);
		}
	}, [activeFile]);

	const handleContentChange = (newContent: string) => {
		setLocalContent(newContent);
		setIsDirty(true);
	};

	const handleDeleteClick = () => {
		setShowDeleteDialog(true);
	};

	const handleConfirmDelete = async () => {
		if (!activeFile) return;

		try {
			await deleteDocument({
				path: activeFile,
				kind: "local",
			});

			setShowDeleteDialog(false);
			onFileDeleted?.();
		} catch (error) {
			console.error("Failed to delete document:", error);
			alert("Failed to delete document");
		}
	};

	const handleCancelDelete = () => {
		setShowDeleteDialog(false);
	};

	return (
		<div className="flex-1 flex flex-col bg-gray-900">
			{/* File Header */}
			{activeFile && (
				<div className="flex items-center justify-between bg-gray-800 border-b border-gray-600 px-4 py-2">
					<div className="flex items-center space-x-2">
						<span className="text-sm text-gray-400">📄</span>
						<span className="text-sm font-medium text-gray-200">
							{activeFile.split("/").pop() || activeFile}
						</span>
						{isDirty && <span className="text-orange-400 text-xs">●</span>}
					</div>
					<div className="flex items-center space-x-3">
						<div className="text-xs text-gray-400 font-mono">{activeFile}</div>
						<button
							type="button"
							onClick={handleDeleteClick}
							disabled={isDeleting}
							className="text-red-400 hover:text-red-300 hover:bg-red-400/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer p-1 rounded transition-colors"
							title="Delete document"
						>
							{isDeleting ? "🗑️..." : "🗑️"}
						</button>
					</div>
				</div>
			)}

			{/* Editor Content */}
			<div className="flex-1 overflow-hidden">
				{isLoading ? (
					<div className="flex items-center justify-center h-full text-gray-500">
						<div className="text-center">
							<div className="text-4xl mb-4">⏳</div>
							<p className="text-lg">Loading document...</p>
						</div>
					</div>
				) : activeFile ? (
					<textarea
						className="w-full h-full bg-gray-900 text-gray-100 p-4 font-mono text-sm resize-none border-none outline-none"
						value={localContent}
						onChange={(e) => handleContentChange(e.target.value)}
						placeholder="Start typing..."
						spellCheck={false}
					/>
				) : (
					<div className="flex items-center justify-center h-full text-gray-500">
						<div className="text-center">
							<div className="text-6xl mb-4">📄</div>
							<p className="text-lg">
								Select a document from the explorer to start editing
							</p>
						</div>
					</div>
				)}
			</div>

			{/* Delete Confirmation Dialog */}
			{showDeleteDialog && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md w-full mx-4">
						<h3 className="text-lg font-medium text-gray-200 mb-4">
							Delete Document
						</h3>
						<p className="text-gray-300 mb-6">
							Are you sure you want to delete "{activeFile?.split("/").pop()}"?
							This action cannot be undone.
						</p>
						<div className="flex justify-end space-x-3">
							<button
								type="button"
								onClick={handleCancelDelete}
								disabled={isDeleting}
								className="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer rounded transition-colors"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleConfirmDelete}
								disabled={isDeleting}
								className="px-4 py-2 text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer rounded transition-colors"
							>
								{isDeleting ? "Deleting..." : "Delete"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
