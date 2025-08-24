import {
	BlockTypeSelect,
	BoldItalicUnderlineToggles,
	CodeToggle,
	CreateLink,
	InsertCodeBlock,
	InsertFrontmatter,
	InsertTable,
	InsertThematicBreak,
	ListsToggle,
	MDXEditor,
	type MDXEditorMethods,
	type MDXEditorProps,
	UndoRedo,
	codeBlockPlugin,
	codeMirrorPlugin,
	frontmatterPlugin,
	headingsPlugin,
	linkDialogPlugin,
	linkPlugin,
	listsPlugin,
	markdownShortcutPlugin,
	quotePlugin,
	tablePlugin,
	thematicBreakPlugin,
	toolbarPlugin,
} from "@mdxeditor/editor";
import { forwardRef } from "react";
import "@mdxeditor/editor/style.css";
import "./dark-theme.css";

interface MDXEditorWrapperProps extends Omit<MDXEditorProps, "plugins"> {
	className?: string;
}

export const MDXEditorWrapper = forwardRef<
	MDXEditorMethods,
	MDXEditorWrapperProps
>(({ className, ...props }, ref) => {
	return (
		<div className={className}>
			<MDXEditor
				className="mdxeditor-dark-theme"
				plugins={[
					// Front-matter plugin (should be early)
					frontmatterPlugin(),

					// Basic formatting plugins
					headingsPlugin(),
					listsPlugin(),
					quotePlugin(),
					thematicBreakPlugin(),

					// Link plugins
					linkPlugin(),
					linkDialogPlugin(),

					// Table plugin
					tablePlugin(),

					// Code block plugins
					codeBlockPlugin({ defaultCodeBlockLanguage: "text" }),
					codeMirrorPlugin({
						codeBlockLanguages: {
							js: "JavaScript",
							jsx: "JavaScript (React)",
							ts: "TypeScript",
							tsx: "TypeScript (React)",
							css: "CSS",
							html: "HTML",
							json: "JSON",
							md: "Markdown",
							text: "Plain Text",
							bash: "Bash",
							sh: "Shell",
							go: "Go",
							python: "Python",
							py: "Python",
						},
					}),

					// Toolbar plugin with comprehensive controls
					toolbarPlugin({
						toolbarContents: () => (
							<>
								<UndoRedo />
								<InsertFrontmatter />
								<BlockTypeSelect />
								<BoldItalicUnderlineToggles />
								<CodeToggle />
								<CreateLink />
								<ListsToggle />
								<InsertTable />
								<InsertCodeBlock />
								<InsertThematicBreak />
							</>
						),
					}),

					// Markdown shortcuts (must be last)
					markdownShortcutPlugin(),
				]}
				{...props}
				ref={ref}
			/>
		</div>
	);
});

MDXEditorWrapper.displayName = "MDXEditorWrapper";
