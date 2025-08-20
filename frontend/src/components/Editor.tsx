import { useEffect, useState } from "react";
import { useGetDocumentContent } from "../api/backend";

interface EditorProps {
	activeFile: string | null;
}

export function Editor({ activeFile }: EditorProps) {
	const [isDirty, setIsDirty] = useState<boolean>(false);
	const [localContent, setLocalContent] = useState<string>("");

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
					<div className="text-xs text-gray-400 font-mono">{activeFile}</div>
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
		</div>
	);
}
