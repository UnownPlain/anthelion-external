import { z } from "zod";
//#region src/schema/release-notes.ts
let ReleaseNotesSource = /* @__PURE__ */ function(ReleaseNotesSource) {
	ReleaseNotesSource["Html"] = "html";
	ReleaseNotesSource["Markdown"] = "markdown";
	ReleaseNotesSource["PlainText"] = "plain-text";
	ReleaseNotesSource["Github"] = "github";
	ReleaseNotesSource["Json"] = "json";
	ReleaseNotesSource["Yaml"] = "yaml";
	ReleaseNotesSource["BrowserRendering"] = "browser-rendering";
	return ReleaseNotesSource;
}({});
const releaseNotesNestedSourceSchema = z.enum([
	"html",
	"markdown",
	"plain-text"
]).describe("Source format for nested release notes content. Supports html, markdown, and plain-text.");
const releaseNotesHtmlSchema = z.object({
	source: z.literal("html"),
	sourceUrl: z.string().describe("Source URL to fetch and parse release notes from. Supports {version} placeholders in URL."),
	releaseNotesUrl: z.string().describe("Optional URL to set in the manifest ReleaseNotesUrl field. Supports {version} placeholders in URL.").optional(),
	characterLimit: z.int().positive().describe("Optional max character limit for parsed HTML release notes.").optional(),
	cleanup: z.boolean().default(true).describe("Cleanup release notes with AI. Enabled by default for HTML sources.").optional()
});
const releaseNotesMarkdownSchema = z.object({
	source: z.literal("markdown"),
	sourceUrl: z.string().describe("Source URL to fetch and parse markdown release notes from. Supports {version} placeholders in URL."),
	releaseNotesUrl: z.string().describe("Optional URL to set in the manifest ReleaseNotesUrl field. Supports {version} placeholders in URL.").optional(),
	characterLimit: z.int().positive().describe("Optional max character limit for parsed markdown release notes.").optional(),
	cleanup: z.boolean().default(true).describe("Cleanup release notes with AI. Enabled by default for markdown sources.").optional()
});
const releaseNotesPlainTextSchema = z.object({
	source: z.literal("plain-text"),
	sourceUrl: z.string().describe("Source URL to fetch plain text release notes from. Supports {version} placeholders in URL."),
	releaseNotesUrl: z.string().describe("Optional URL to set in the manifest ReleaseNotesUrl field. Supports {version} placeholders in URL.").optional(),
	characterLimit: z.int().positive().describe("Optional max character limit for fetched plain text release notes.").optional(),
	cleanup: z.boolean().default(true).describe("Cleanup release notes with AI. Disabled by default for plain text sources.").optional()
});
const releaseNotesBrowserRenderingSchema = z.object({
	source: z.literal("browser-rendering"),
	sourceUrl: z.string().describe("Source URL to fetch rendered markdown release notes from using Cloudflare Browser Rendering. Supports {version} placeholders in URL."),
	releaseNotesUrl: z.string().describe("Optional URL to set in the manifest ReleaseNotesUrl field. Supports {version} placeholders in URL.").optional(),
	characterLimit: z.int().positive().describe("Optional max character limit for parsed markdown release notes.").optional(),
	waitUntil: z.enum([
		"load",
		"domcontentloaded",
		"networkidle0",
		"networkidle2"
	]).describe("Optional browser wait condition for navigation.").optional(),
	waitForSelector: z.string().describe("Optional selector to wait for before capturing markdown.").optional(),
	cleanup: z.boolean().default(true).describe("Cleanup release notes with AI. Enabled by default for browser rendering sources.").optional()
});
const releaseNotesGithubSchema = z.object({
	source: z.literal("github"),
	owner: z.string().describe("GitHub repository owner. Optional when strategy is github-release (defaults to github.owner).").optional(),
	repo: z.string().describe("GitHub repository name. Optional when strategy is github-release (defaults to github.repo).").optional(),
	tag: z.string().describe("Tag template for the release notes lookup. Supports {version}. Optional when strategy is github-release (uses resolved release tag).").optional(),
	cleanup: z.boolean().default(false).describe("Cleanup release notes with AI. Disabled by default for GitHub sources.").optional()
});
const releaseNotesJsonSchema = z.object({
	source: z.literal("json"),
	sourceUrl: z.url().describe("Endpoint returning JSON release notes content or URLs. Supports {version}."),
	releaseNotesUrl: z.string().describe("Optional URL to set in the manifest ReleaseNotesUrl field. Supports {version} placeholders in URL.").optional(),
	path: z.string().describe("Dot-separated path to release notes content or URL."),
	nestedSource: releaseNotesNestedSourceSchema,
	cleanup: z.boolean().describe("Cleanup release notes with AI. Defaults to the nestedSource cleanup behavior.").optional()
});
const releaseNotesYamlSchema = z.object({
	source: z.literal("yaml"),
	sourceUrl: z.url().describe("Endpoint returning YAML release notes content or URLs. Supports {version}."),
	releaseNotesUrl: z.string().describe("Optional URL to set in the manifest ReleaseNotesUrl field. Supports {version} placeholders in URL.").optional(),
	path: z.string().describe("Dot-separated path to release notes content or URL."),
	nestedSource: releaseNotesNestedSourceSchema,
	cleanup: z.boolean().describe("Cleanup release notes with AI. Defaults to the nestedSource cleanup behavior.").optional()
});
const releaseNotesUrlOnlySchema = z.object({ releaseNotesUrl: z.string().describe("URL to set in the manifest ReleaseNotesUrl field. Supports {version} placeholders.") }).strict();
const releaseNotesSourceSchema = z.discriminatedUnion("source", [
	releaseNotesHtmlSchema,
	releaseNotesMarkdownSchema,
	releaseNotesPlainTextSchema,
	releaseNotesBrowserRenderingSchema,
	releaseNotesGithubSchema,
	releaseNotesJsonSchema,
	releaseNotesYamlSchema
]);
const releaseNotesSchema = z.union([releaseNotesSourceSchema, releaseNotesUrlOnlySchema]).optional();
//#endregion
export { ReleaseNotesSource, releaseNotesSchema };
