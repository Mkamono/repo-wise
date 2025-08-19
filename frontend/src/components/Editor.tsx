import { useCallback, useEffect, useState } from "react";
import { getDocumentContent } from "../../backend";

interface EditorProps {
	activeFile: string | null;
}

export function Editor({ activeFile }: EditorProps) {
	const [content, setContent] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(false);
	const [isDirty, setIsDirty] = useState<boolean>(false);

	const loadDocumentContent = useCallback(
		async (path: string): Promise<string> => {
			try {
				console.log("Loading document content for path:", path);
				const response = await getDocumentContent({ path, kind: "local" });
				console.log("Document content response:", response);
				return response.data.content;
			} catch (error) {
				console.error("Failed to load document content:", error);
				if (error && typeof error === "object" && "response" in error) {
					const axiosError = error as {
						response?: { data?: unknown; status?: number };
					};
					console.error("Error response data:", axiosError.response?.data);
					console.error("Error response status:", axiosError.response?.status);
				}
				return `Error loading content for ${path}: ${error instanceof Error ? error.message : String(error)}`;
			}
		},
		[],
	);

	useEffect(() => {
		const openFile = async () => {
			if (!activeFile) {
				setContent("");
				setLoading(false);
				setIsDirty(false);
				return;
			}

			setLoading(true);
			setIsDirty(false);

			// Load content
			const fileContent = await loadDocumentContent(activeFile);
			setContent(fileContent);
			setLoading(false);
		};

		openFile();
	}, [activeFile, loadDocumentContent]);

	const handleContentChange = (newContent: string) => {
		setContent(newContent);
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
				{loading ? (
					<div className="flex items-center justify-center h-full text-gray-500">
						<div className="text-center">
							<div className="text-4xl mb-4">⏳</div>
							<p className="text-lg">Loading document...</p>
						</div>
					</div>
				) : activeFile ? (
					<textarea
						className="w-full h-full bg-gray-900 text-gray-100 p-4 font-mono text-sm resize-none border-none outline-none"
						value={content}
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
