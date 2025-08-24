import type { MDXEditorMethods } from "@mdxeditor/editor";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	useDeleteDocument,
	useGetDocumentContent,
	usePutDocumentContent,
} from "../api/backend";
import { MDXEditorWrapper } from "./mdxEditor/Editor";

interface EditorProps {
	activeFile: string | null;
	onFileDeleted?: () => void;
}

export function Editor({ activeFile, onFileDeleted }: EditorProps) {
	const [isDirty, setIsDirty] = useState<boolean>(false);
	const [localContent, setLocalContent] = useState<string>("");
	const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
	const mdxEditorRef = useRef<MDXEditorMethods>(null);

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

	const { trigger: updateDocumentContent, isMutating: isSaving } =
		usePutDocumentContent(
			activeFile ? { path: activeFile, kind: "local" } : undefined,
		);

	useEffect(() => {
		if (contentResponse?.data.content !== undefined) {
			setLocalContent(contentResponse.data.content);
			mdxEditorRef.current?.setMarkdown(contentResponse.data.content);
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
			mdxEditorRef.current?.setMarkdown("");
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

	const formatContent = useCallback((content: string): string => {
		// HTMLエンティティをデコード
		let formatted = content
			.replace(/&#x20;/g, " ") // スペース
			.replace(/&#xa0;/g, "\u00A0") // ノンブレークスペース
			.replace(/&nbsp;/g, "\u00A0") // ノンブレークスペース
			.replace(/&amp;/g, "&") // アンパサンド
			.replace(/&lt;/g, "<") // 小なり
			.replace(/&gt;/g, ">") // 大なり
			.replace(/&quot;/g, '"') // ダブルクォート
			.replace(/&#x27;/g, "'"); // シングルクォート

		// 連続する空行を最大2つまでに制限
		formatted = formatted.replace(/\n{3,}/g, "\n\n");

		// 行の末尾の不要な空白を削除
		formatted = formatted.replace(/[ \t\u00A0]+$/gm, "");

		// ファイルの先頭と末尾の不要な改行を削除
		formatted = formatted.replace(/^\n+/, "").replace(/\n+$/, "");

		// 末尾に改行を1つ確保（Markdownファイルの標準として）
		formatted = `${formatted}\n`;

		return formatted;
	}, []);

	const handleSave = useCallback(async () => {
		if (!activeFile || !isDirty) return;

		try {
			const contentToSave = formatContent(localContent);

			await updateDocumentContent({
				content: contentToSave,
			});
			setIsDirty(false);
		} catch (error) {
			console.error("Failed to save document:", error);
			alert("Failed to save document");
		}
	}, [activeFile, isDirty, localContent, updateDocumentContent, formatContent]);

	// Ctrl/Cmd+S キーボードショートカット
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (
				(event.ctrlKey || event.metaKey) &&
				(event.key === "s" || event.key === "S" || event.code === "KeyS")
			) {
				// 即座にイベントを停止
				event.preventDefault();
				event.stopPropagation();
				event.stopImmediatePropagation();

				// 非同期で保存処理を実行（イベント処理の完全な停止のため）
				setTimeout(() => {
					handleSave();
				}, 0);

				return false;
			}
		};

		// 可能な限り早い段階でイベントを捕獲
		const options = { capture: true, passive: false };

		window.addEventListener("keydown", handleKeyDown, options);
		document.addEventListener("keydown", handleKeyDown, options);
		document.body.addEventListener("keydown", handleKeyDown, options);

		return () => {
			window.removeEventListener("keydown", handleKeyDown, options);
			document.removeEventListener("keydown", handleKeyDown, options);
			document.body.removeEventListener("keydown", handleKeyDown, options);
		};
	}, [handleSave]);

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
						{isSaving && <span className="text-blue-400 text-xs">💾</span>}
						{isDirty && !isSaving && (
							<span className="text-orange-400 text-xs">●</span>
						)}
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
					<MDXEditorWrapper
						ref={mdxEditorRef}
						className="w-full h-full [&_.mdxeditor]:h-full"
						markdown={localContent}
						onChange={handleContentChange}
						placeholder="Start typing..."
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
