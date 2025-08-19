export function StatusBar() {
	return (
		<div className="bg-blue-600 text-white text-xs px-4 py-1 flex items-center justify-between">
			<div className="flex items-center space-x-4">
				<span>Ready</span>
				<span>Ln 1, Col 1</span>
			</div>
			<div className="flex items-center space-x-4">
				<span>TypeScript</span>
				<span>UTF-8</span>
				<span>LF</span>
			</div>
		</div>
	);
}
