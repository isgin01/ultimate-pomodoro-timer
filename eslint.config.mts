import tseslint from "typescript-eslint"
import obsidianmd from "eslint-plugin-obsidianmd"
import globals from "globals"
import { globalIgnores } from "eslint/config"

export default tseslint.config(
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: ["eslint.config.js", "manifest.json"],
				},
				// TODO: what are these errors #1
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: [".json"],
			},
		},
	},
	// TODO: what are these errors #2
	...obsidianmd.configs.recommended,
	{
		rules: {
			"sort-imports": "error",
		},
	},
	globalIgnores([
		"node_modules",
		"dist",
		"esbuild.config.mjs",
		"eslint.config.js",
		"version-bump.mjs",
		"versions.json",
		"main.js",
	]),
)
