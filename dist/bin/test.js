#!/usr/bin/env bun
import fs from "@rcompat/fs";
import { getExistingPullRequest, getFormattedGithubReleaseNotes, htmlToPlainText, markdownToPlainText, updateVersion } from "@unownplain/anthelion-komac";
import ansis, { bgRed, blue, green, magenta, redBright, yellow } from "ansis";
import { delay, limitAsync } from "es-toolkit";
import ky from "ky";
import { ZodError, z } from "zod";
import { extname, join, resolve } from "node:path";
import { Octokit } from "octokit";
import { parse } from "yaml";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
//#region src/config.ts
function getShardsDirectory() {
	return resolve(process.env.ANTHELION_SHARDS_DIR || "shards");
}
function getTargetRepository() {
	return {
		owner: process.env.KOMAC_GITHUB_OWNER || "microsoft",
		repo: process.env.KOMAC_GITHUB_REPO || "winget-pkgs",
		branch: process.env.ANTHELION_GITHUB_BRANCH || "master"
	};
}
//#endregion
//#region src/github.ts
const githubClient = new Octokit({ auth: process.env.GITHUB_TOKEN });
const INSTALLER_EXTENSIONS = /* @__PURE__ */ new Set([
	".exe",
	".msi",
	".msix",
	".msixbundle",
	".appx",
	".zip"
]);
async function getLatestReleaseFromRedirect({ owner, repo, tagIncludes = "" }) {
	const location = (await ky.head(`https://github.com/${owner}/${repo}/releases/latest`, {
		redirect: "manual",
		throwHttpErrors: false
	})).headers.get("location");
	if (!location) throw new Error("No GitHub release redirect found");
	const releaseUrl = new URL(location, "https://github.com");
	const tag = releaseUrl.pathname.split("/").at(-1);
	if (!tag) throw new Error(`Unexpected GitHub release redirect: ${releaseUrl.href}`);
	if (tag === "latest") throw new Error(`GitHub repository has moved: ${releaseUrl.href}`);
	return {
		version: tag.replace(/^v/, "").replace(tagIncludes, ""),
		tag: tag.replace(/^v/, ""),
		rawTag: tag,
		title: void 0,
		assetNames: () => [],
		urls: () => []
	};
}
async function getLatestRelease(options) {
	const { owner, repo, kind = "stable", tagIncludes = "", useLatestEndpoint, perPage = 25 } = options;
	let release;
	if (useLatestEndpoint) {
		const { data } = await githubClient.rest.repos.getLatestRelease({
			owner,
			repo
		});
		release = data;
	} else {
		let { data: releases } = await githubClient.rest.repos.listReleases({
			owner,
			repo,
			per_page: perPage
		});
		switch (kind) {
			case "all": break;
			case "prerelease":
				releases = releases.filter((release) => release.prerelease);
				break;
			case "stable":
				releases = releases.filter((release) => !release.prerelease);
				break;
		}
		if (tagIncludes) release = releases.find((release) => release.tag_name.includes(tagIncludes));
		else release = releases[0];
	}
	if (!release) throw new Error("No GitHub release found");
	return {
		version: release.tag_name.replace(/^v/, "").replace(tagIncludes, ""),
		tag: release.tag_name.replace(/^v/, ""),
		rawTag: release.tag_name,
		title: release.name,
		assetNames: () => release.assets.map((asset) => asset.name),
		urls: () => release.assets.filter((asset) => INSTALLER_EXTENSIONS.has(extname(asset.name))).map((asset) => asset.browser_download_url)
	};
}
async function getRepositoryHeadSha() {
	const repository = process.env.GITHUB_REPOSITORY;
	if (!repository) throw new Error("Missing GITHUB_REPOSITORY environment variable");
	const [owner, repo] = repository.split("/");
	if (!owner || !repo) throw new Error("Invalid GITHUB_REPOSITORY format; expected owner/repo");
	const { data } = await githubClient.rest.repos.getCommit({
		owner,
		repo,
		ref: "HEAD"
	});
	return data.sha;
}
//#endregion
//#region src/helpers.ts
var Logger = class {
	logs = [];
	log(line) {
		this.logs.push(line);
	}
	blankLine() {
		if (this.logs.at(-1) !== "") this.logs.push("");
	}
	logUpdateResult(result) {
		for (const file of result.changes) this.logs.push(file.content);
		this.logs.push(`Pull request URL: ${result.pullRequestUrl ? result.pullRequestUrl : "Dry Run"}`);
	}
	stateMatches() {
		this.logs.push(green`Stored state matches latest state.`);
	}
	flush() {
		for (const line of this.logs) console.log(line);
		this.logs = [];
	}
	run(shard) {
		this.log(`${blue("==>")} Running ${shard}`);
	}
	duration(shard, milliseconds) {
		this.log(`${magenta("==>")} Completed ${shard} in ${formatDuration(milliseconds)}`);
	}
	present(version) {
		this.log(green`Package is up-to-date! (${version})`);
	}
	prExists(pr) {
		if (pr.createdByAuthenticatedUser) this.log(green`PR with state ${pr.state} was created at ${pr.createdAt}.`);
		else this.log(yellow`PR created by ${pr.createdBy} with state ${pr.state} created at ${pr.createdAt}.`);
		this.log(pr.pullRequestUrl);
	}
	error(shard, error) {
		this.log(bgRed`❌ Error running ${shard}`);
		this.log(redBright(formatError(error)));
	}
	details(version, urls) {
		this.log(`Version: ${version}`);
		this.log(`URLs: ${urls.join(" ")}\n`);
	}
};
function formatDuration(milliseconds) {
	if (milliseconds < 1e3) return `${milliseconds.toFixed(0)}ms`;
	const seconds = milliseconds / 1e3;
	if (seconds < 60) return `${seconds.toFixed(2)}s`;
	return `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(2)}s`;
}
function formatError(error) {
	if (error instanceof ZodError) {
		const prettyError = z.prettifyError(error);
		return error.stack ? `${prettyError}\n\n${error.stack}` : prettyError;
	}
	if (error instanceof Error) return error.stack ?? error.message;
	return String(error);
}
function compareVersions(a, b) {
	const partsA = a.split(".").map(Number);
	const partsB = b.split(".").map(Number);
	const maxLength = Math.max(partsA.length, partsB.length);
	for (let i = 0; i < maxLength; i++) {
		const numA = partsA[i] ?? 0;
		const numB = partsB[i] ?? 0;
		if (numA !== numB) return numA - numB;
	}
	return 0;
}
function vs(str) {
	return z.string().parse(str).trim();
}
function get(obj, path, defaultValue) {
	return path.split(".").reduce((acc, key) => acc?.[key], obj) ?? defaultValue;
}
function isHttpUrl(value) {
	return z.url().safeParse(value).success;
}
function resolveValuePlaceholders(template, values) {
	return template.replaceAll(/\{([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)(?:\|([^|{}]*)\|([^{}]*))?\}/g, (placeholder, path, from, to) => {
		const value = get(values, path);
		if (typeof value !== "string") throw new Error(`Unable to resolve placeholder ${placeholder}`);
		return from ? value.replaceAll(from, to ?? "") : value;
	});
}
function match(str, regex) {
	const globalRegex = regex.global ? regex : new RegExp(regex.source, `${regex.flags}g`);
	const groups = Array.from(vs(str).matchAll(globalRegex)).flatMap((match) => match.slice(1));
	const validated = z.array(z.string()).parse(groups);
	if (validated.length === 0) throw new Error("Regex match not found");
	return validated;
}
async function isStateMatching(packageIdentifier, newState) {
	if (process.env.DRY_RUN) return;
	const versionStatePath = `version-state/${packageIdentifier}`;
	return newState === (await fs.ref(versionStatePath).text()).trim();
}
async function checkVersionInRepo(version, packageIdentifier, logger = new Logger()) {
	if (process.env.DRY_RUN) return false;
	const { owner, repo, branch } = getTargetRepository();
	const manifestPath = `${`https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/manifests`}/${packageIdentifier.charAt(0).toLowerCase()}/${packageIdentifier.split(".").join("/")}/${version}/${packageIdentifier}.yaml`;
	if ((await ky.head(manifestPath, { throwHttpErrors: false })).ok && !process.env.DRY_RUN) {
		logger.present(version);
		return true;
	}
	const existingPR = await getExistingPullRequest({
		packageIdentifier,
		version,
		token: process.env.GITHUB_TOKEN
	});
	if (existingPR) {
		logger.prExists(existingPR);
		return true;
	}
}
async function closeAllButMostRecentPR(packageIdentifier) {
	if (process.env.DRY_RUN) return;
	await delay(1e4);
	const { owner, repo } = getTargetRepository();
	const { data: authenticatedUser } = await githubClient.rest.users.getAuthenticated();
	const prSearch = await githubClient.rest.search.issuesAndPullRequests({ q: `${packageIdentifier} is:pr author:${authenticatedUser.login} is:open repo:${owner}/${repo} sort:created-desc` });
	for (const pr of prSearch.data.items.slice(1)) await githubClient.rest.pulls.update({
		owner,
		repo,
		pull_number: pr.number,
		state: "closed"
	});
}
async function updateVersionState(packageIdentifier, latestVersion) {
	if (process.env.DRY_RUN) return;
	const versionStatePath = `version-state/${packageIdentifier}`;
	await githubClient.graphql(`
		mutation UpdateFile($input: CreateCommitOnBranchInput!) {
			createCommitOnBranch(input: $input) {
				commit {
					url
				}
			}
		}
	`, { input: {
		branch: {
			repositoryNameWithOwner: process.env.GITHUB_REPOSITORY,
			branchName: process.env.GITHUB_REF_NAME
		},
		message: { headline: `[ci skip] Update ${packageIdentifier} version state` },
		fileChanges: { additions: [{
			path: versionStatePath,
			contents: btoa(latestVersion)
		}] },
		expectedHeadOid: await getRepositoryHeadSha()
	} });
}
function normalizeVersion(version, remove) {
	const normalized = version.startsWith("v") ? version.substring(1) : version;
	return remove ? normalized.replaceAll(remove, "") : normalized;
}
function resolveDataBackedUrls(urls, data) {
	return urls.map((url) => isHttpUrl(url) ? url : vs(get(data, url)));
}
function firstMatch(str, regex, errorMessage) {
	const version = match(str, regex)[0];
	if (!version) throw new Error(errorMessage);
	return version;
}
function dedent(strings, ...values) {
	let text = strings[0] ?? "";
	for (let i = 0; i < values.length; i++) text += `${values[i] ?? ""}${strings[i + 1] ?? ""}`;
	const lines = text.replace(/^\r?\n/, "").replace(/\r?\n[\t ]*$/, "").split(/\r?\n/);
	const indentation = lines.filter((line) => line.trim().length > 0).map((line) => line.match(/^[\t ]*/)?.[0].length ?? 0);
	const minIndentation = Math.min(...indentation);
	if (!Number.isFinite(minIndentation) || minIndentation === 0) return lines.join("\n");
	return lines.map((line) => line.trim().length > 0 ? line.slice(minIndentation) : "").join("\n");
}
//#endregion
//#region src/schema/release-notes.ts
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
//#region src/release-notes.ts
const CLEANUP_SYSTEM_PROMPT = dedent`
	Your goal is to format release notes from HTML, markdown, XML, or unclean text into plain text suitable for viewing in terminals.

	Return only the cleaned plain text. Do not return JSON, markdown fences, commentary, or an explanation. Return an empty response if the input does not contain release notes for the requested package and version.

	Do not summarize the content and format the text verbatim. Place newlines between headers but not between bullet points.

	Remove any unnecessary info such as:
	- Headers such as "Release Notes", "<app_name> Release Notes", "<app_name> Release", "<version>", "<app_name> version", etc.
	- Any checksum (SHA256, etc.) sections/tables
	- Download methods/commands/how to download
	- Released on dates
	- Time to read (X min read)

	The package identifier is {packageIdentifier} and current package version is {version}. Only include the release notes for this version and package. If the package or version is not specified, assume it is the correct version or package.
`;
async function cleanupReleaseNotes(releaseNotes, version, packageIdentifier) {
	if (!process.env.GROQ_API_KEY) return;
	const { text } = await generateText({
		model: groq("openai/gpt-oss-120b"),
		system: CLEANUP_SYSTEM_PROMPT.replaceAll("{version}", version).replaceAll("{packageIdentifier}", packageIdentifier),
		prompt: releaseNotes,
		temperature: 0
	});
	return text.trim() || void 0;
}
function limitLength(releaseNotes, characterLimit) {
	return characterLimit && releaseNotes.length > characterLimit ? releaseNotes.slice(0, characterLimit).trim() : releaseNotes;
}
async function formatReleaseNotes(content, source) {
	switch (source) {
		case "markdown": return await markdownToPlainText(content) ?? content;
		case "html": return await htmlToPlainText(content) ?? content;
		case "plain-text": return content;
	}
}
async function fetchBrowserRenderedMarkdown(options) {
	const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } = process.env;
	if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) return;
	const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/browser-rendering/markdown`;
	const requestBody = { url: options.url };
	if (options.waitUntil) requestBody.gotoOptions = { waitUntil: options.waitUntil };
	if (options.waitForSelector) requestBody.waitForSelector = options.waitForSelector;
	const response = await ky.post(endpoint, {
		headers: { authorization: `Bearer ${CLOUDFLARE_API_TOKEN}` },
		json: { ...requestBody },
		throwHttpErrors: false
	});
	const data = await response.json();
	if (!response.ok || !data.success || typeof data.result !== "string") {
		const errorMessage = data.errors?.[0]?.message ?? "Unknown error from Cloudflare Browser Rendering";
		throw new Error(`Cloudflare Browser Rendering failed: ${errorMessage}`);
	}
	return data.result;
}
async function resolveNestedReleaseNotes(sourceUrl, path, source, format) {
	let rawReleaseNotes = vs(get(format === "json" ? await ky(sourceUrl).json() : parse(await ky(sourceUrl).text()), path));
	let releaseNotesUrl;
	if (isHttpUrl(rawReleaseNotes)) {
		releaseNotesUrl = rawReleaseNotes;
		rawReleaseNotes = vs(await ky(rawReleaseNotes).text());
	}
	return {
		releaseNotes: await formatReleaseNotes(rawReleaseNotes, source),
		releaseNotesUrl
	};
}
async function resolveReleaseNotes(releaseNotes, packageIdentifier, version, githubTag, github, templateValues = {}) {
	const releaseNotesConfig = releaseNotesSchema.safeParse(releaseNotes).data;
	const manifest = {
		releaseNotes: void 0,
		releaseNotesUrl: void 0
	};
	if (!releaseNotesConfig) return manifest;
	const values = {
		...templateValues,
		version
	};
	if (!("source" in releaseNotesConfig)) {
		manifest.releaseNotesUrl = resolveValuePlaceholders(releaseNotesConfig.releaseNotesUrl, values);
		return manifest;
	}
	switch (releaseNotesConfig.source) {
		case "html":
		case "markdown":
		case "plain-text": {
			const sourceUrl = resolveValuePlaceholders(releaseNotesConfig.sourceUrl, values);
			manifest.releaseNotesUrl = releaseNotesConfig.releaseNotesUrl ? resolveValuePlaceholders(releaseNotesConfig.releaseNotesUrl, values) : sourceUrl;
			manifest.releaseNotes = limitLength(await formatReleaseNotes(await ky(sourceUrl).text(), releaseNotesConfig.source), releaseNotesConfig.characterLimit);
			break;
		}
		case "github": {
			const owner = releaseNotesConfig.owner || github?.owner;
			const repo = releaseNotesConfig.repo || github?.repo;
			const tag = releaseNotesConfig.tag ? resolveValuePlaceholders(releaseNotesConfig.tag, values) : githubTag;
			if (!owner || !repo) throw new Error("releaseNotes.github owner and repo are required unless strategy is github-release");
			if (!tag) throw new Error("releaseNotes.tag is required unless strategy is github-release and a GitHub release tag was resolved");
			manifest.releaseNotesUrl = `https://github.com/${owner}/${repo}/releases/tag/${tag}`;
			manifest.releaseNotes = await getFormattedGithubReleaseNotes(owner, repo, tag, process.env.GITHUB_TOKEN) ?? void 0;
			break;
		}
		case "json": {
			const sourceUrl = resolveValuePlaceholders(releaseNotesConfig.sourceUrl, values);
			manifest.releaseNotesUrl = releaseNotesConfig.releaseNotesUrl ? resolveValuePlaceholders(releaseNotesConfig.releaseNotesUrl, values) : sourceUrl;
			const result = await resolveNestedReleaseNotes(sourceUrl, releaseNotesConfig.path, releaseNotesConfig.nestedSource, "json");
			manifest.releaseNotes = result.releaseNotes;
			manifest.releaseNotesUrl = result.releaseNotesUrl ?? manifest.releaseNotesUrl;
			break;
		}
		case "yaml": {
			const sourceUrl = resolveValuePlaceholders(releaseNotesConfig.sourceUrl, values);
			manifest.releaseNotesUrl = releaseNotesConfig.releaseNotesUrl ? resolveValuePlaceholders(releaseNotesConfig.releaseNotesUrl, values) : sourceUrl;
			const result = await resolveNestedReleaseNotes(sourceUrl, releaseNotesConfig.path, releaseNotesConfig.nestedSource, "yaml");
			manifest.releaseNotes = result.releaseNotes;
			manifest.releaseNotesUrl = result.releaseNotesUrl ?? manifest.releaseNotesUrl;
			break;
		}
		case "browser-rendering": {
			const sourceUrl = resolveValuePlaceholders(releaseNotesConfig.sourceUrl, values);
			manifest.releaseNotesUrl = releaseNotesConfig.releaseNotesUrl ? resolveValuePlaceholders(releaseNotesConfig.releaseNotesUrl, values) : sourceUrl;
			const renderedMarkdown = await fetchBrowserRenderedMarkdown({
				url: sourceUrl,
				waitUntil: releaseNotesConfig.waitUntil,
				waitForSelector: releaseNotesConfig.waitForSelector
			});
			if (renderedMarkdown !== void 0) manifest.releaseNotes = limitLength(await formatReleaseNotes(renderedMarkdown, "markdown"), releaseNotesConfig.characterLimit);
			break;
		}
	}
	if (!manifest.releaseNotes) manifest.releaseNotesUrl = void 0;
	if ("cleanup" in releaseNotesConfig && (releaseNotesConfig.cleanup ?? true) && manifest.releaseNotes) manifest.releaseNotes = await cleanupReleaseNotes(manifest.releaseNotes, version, packageIdentifier);
	return manifest;
}
//#endregion
//#region src/schema/json-shard.ts
const githubSchema = z.object({
	owner: z.string(),
	repo: z.string(),
	preRelease: z.boolean().default(false).optional(),
	fetchUrlsFromApi: z.boolean().describe("Fetch asset download URLs via the GitHub Releases API instead of relying on templates.").default(false).optional(),
	tagFilter: z.string().optional(),
	fetchLatest: z.boolean().default(false).optional(),
	perPage: z.number().int().positive().describe("Number of releases to fetch from the GitHub Releases API.").default(25).optional()
});
const pageMatchSchema = z.object({
	url: z.url(),
	regex: z.string().describe("Regex whose first capture or named \"version\" capture contains the version. Use {version} in templates; other named captures are available as {captures.name}.")
});
const sortVersionsSchema = z.object({
	url: z.url(),
	regex: z.string()
});
const redirectMatchSchema = z.object({
	url: z.url(),
	regex: z.string(),
	method: z.enum(["head", "get"]).default("head").optional()
});
const sourceforgeSchema = z.object({
	project: z.string().describe("SourceForge project slug (e.g. winscp)."),
	file: z.string().describe("File name pattern with {version} placeholder.").optional()
});
const electronBuilderSchema = z.object({ url: z.url().describe("Direct YAML URL (latest.yml, beta.yml, etc.).") });
const jsonStrategySchema = z.object({
	url: z.url().describe("Endpoint returning JSON."),
	path: z.string().describe("Dot-separated path to string value (arrays use numeric indexes).")
});
const yamlStrategySchema = z.object({
	url: z.url().describe("Endpoint returning YAML."),
	path: z.string().describe("Dot-separated path to string value (arrays use numeric indexes).")
});
const responseHeaderStateSchema = z.object({
	source: z.literal("response-header"),
	url: z.string().describe("URL whose response header is used as the persisted state."),
	header: z.string().min(1).describe("Response header containing the persisted state."),
	method: z.enum(["head", "get"]).default("head").optional()
});
const stateSchema = z.discriminatedUnion("source", [responseHeaderStateSchema, z.object({
	source: z.literal("value"),
	value: z.string().min(1).describe("Persisted state value. Supports resolved placeholders.")
})]);
const urlsSchema$1 = z.array(z.string()).min(1).describe("Template or literal URLs. Supports {version}, named values such as {captures.name}, and {value|from|to} replacement.");
const baseShardFields = {
	$schema: z.url().describe("Optional JSON Schema reference URL.").optional(),
	releaseNotes: releaseNotesSchema,
	replace: z.boolean().default(false).describe("Replace latest version with new version.").optional(),
	versionRemove: z.string().describe("Substring(s) to strip after auto-leading 'v' removal.").optional(),
	version: z.string().min(1).describe("Optional override for the resolved package version.").optional(),
	installerMatches: z.array(z.string().min(1)).min(1).describe("Executable names used to match installers inside an archive.").optional(),
	state: stateSchema.describe("Optional state used to skip unchanged updates.").optional()
};
const githubReleaseVariant = z.object({
	...baseShardFields,
	strategy: z.literal("github-release"),
	github: githubSchema,
	urls: urlsSchema$1.optional()
}).superRefine((shard, ctx) => {
	const fetchUrlsFromApi = shard.github.fetchUrlsFromApi;
	if (fetchUrlsFromApi && shard.urls && shard.urls.length > 0) ctx.addIssue({
		code: "custom",
		message: "Cannot provide URL templates when fetching from the GitHub Releases API.",
		path: ["urls"]
	});
	else if (!fetchUrlsFromApi && (!shard.urls || shard.urls.length === 0)) ctx.addIssue({
		code: "custom",
		message: "At least one URL template is required unless fetchUrlsFromApi is enabled.",
		path: ["urls"]
	});
});
const pageMatchVariant = z.object({
	...baseShardFields,
	strategy: z.literal("page-match"),
	pageMatch: pageMatchSchema,
	urls: urlsSchema$1
});
const sortVersionsVariant = z.object({
	...baseShardFields,
	strategy: z.literal("sort-versions"),
	sortVersions: sortVersionsSchema,
	urls: urlsSchema$1
});
const redirectMatchVariant = z.object({
	...baseShardFields,
	strategy: z.literal("redirect-match"),
	redirectMatch: redirectMatchSchema,
	urls: urlsSchema$1.optional()
});
const sourceforgeVariant = z.object({
	...baseShardFields,
	strategy: z.literal("sourceforge"),
	sourceforge: sourceforgeSchema,
	urls: urlsSchema$1
});
const electronBuilderVariant = z.object({
	...baseShardFields,
	strategy: z.literal("electron-builder"),
	electronBuilder: electronBuilderSchema,
	urls: urlsSchema$1
});
const jsonVariant = z.object({
	...baseShardFields,
	strategy: z.literal("json"),
	json: jsonStrategySchema,
	urls: urlsSchema$1
});
const yamlVariant = z.object({
	...baseShardFields,
	strategy: z.literal("yaml"),
	yaml: yamlStrategySchema,
	urls: urlsSchema$1
});
const staticVariant = z.object({
	...baseShardFields,
	strategy: z.literal("static"),
	version: z.string().min(1),
	urls: urlsSchema$1
});
const JsonShardSchema = z.discriminatedUnion("strategy", [
	githubReleaseVariant,
	pageMatchVariant,
	sortVersionsVariant,
	redirectMatchVariant,
	sourceforgeVariant,
	electronBuilderVariant,
	jsonVariant,
	yamlVariant,
	staticVariant
]).superRefine((shard, ctx) => {
	if (!shard.releaseNotes || !("source" in shard.releaseNotes)) return;
	if (shard.releaseNotes.source !== "github") return;
	if (shard.strategy !== "github-release" && !shard.releaseNotes.tag) ctx.addIssue({
		code: "custom",
		message: "releaseNotes.tag is required unless strategy is github-release.",
		path: ["releaseNotes", "tag"]
	});
});
//#endregion
//#region src/schema/script-shard.ts
const urlArrayInputSchema = z.array(z.string().nullish().transform((url) => z.string().parse(url)));
const urlsSchema = z.union([urlArrayInputSchema, z.custom((value) => typeof value === "function", { message: "Expected an array of URLs or a function returning URLs" })]).transform((urls) => typeof urls === "function" ? async () => urlArrayInputSchema.parse(await urls()) : () => urls);
const versionSchema = z.custom((value) => typeof value === "function", { message: "Expected a function returning a version" }).transform((version) => () => z.string().parse(version()));
const versionInputSchema = z.string().optional().transform((version) => z.string().parse(version));
const scriptShardCommonSchema = z.object({
	urls: urlsSchema,
	releaseNotes: releaseNotesSchema,
	replace: z.boolean().optional(),
	skipPrCheck: z.boolean().default(false),
	installerMatches: z.string().array().optional()
});
const ScriptShardResult = z.union([scriptShardCommonSchema.extend({
	version: versionSchema,
	state: z.string().min(1)
}), scriptShardCommonSchema.extend({
	version: versionInputSchema,
	state: z.undefined().optional()
})]);
//#endregion
//#region src/strategies.ts
async function electronBuilder(url) {
	return vs(parse(await ky(url).text(), { schema: "failsafe" }).version);
}
async function pageMatch(url, regex) {
	const page = await ky(url).text();
	const match = regex.exec(page.trim());
	const captures = match?.groups ?? {};
	const version = captures.version ?? match?.[1];
	if (!version) throw new Error("Failed to extract version from page");
	return {
		version: vs(version),
		captures
	};
}
async function redirectMatch(url, regex) {
	const redirect = (await ky(url, {
		redirect: "manual",
		throwHttpErrors: false
	})).headers.get("location");
	if (!redirect) throw new Error("No redirect location found");
	return {
		version: firstMatch(redirect, regex, "Failed to extract version from URL"),
		url: redirect
	};
}
function sortVersions(str, regex) {
	const globalRegex = regex.global ? regex : new RegExp(regex.source, `${regex.flags}g`);
	const matches = str.matchAll(globalRegex);
	const versions = Array.from(matches, (match) => vs(match[1]));
	versions.sort((a, b) => compareVersions(b, a));
	return versions[0];
}
async function sortVersionsMatch(url, regex) {
	const version = sortVersions(await ky(url).text(), regex);
	if (!version) throw new Error("Failed to extract version from page");
	return version;
}
async function sourceforge(projectName, fileName) {
	const SOURCEFORGE_VERSION_REGEX = "(\\d+(?:[-.]\\d+)+)";
	const feedUrl = `https://sourceforge.net/projects/${projectName}/rss`;
	const regex = fileName ? new RegExp(`url=.*?/${RegExp.escape(projectName)}/files/.*?/${RegExp.escape(fileName).replace("\\{version\\}", SOURCEFORGE_VERSION_REGEX)}`, "i") : new RegExp(`url=.*?/${RegExp.escape(projectName)}/files/.*?[-_/]${SOURCEFORGE_VERSION_REGEX}[-_/%.]`, "i");
	const version = sortVersions(await ky(feedUrl).text(), regex);
	if (!version) throw new Error("Failed to extract version from SourceForge feed");
	return version;
}
//#endregion
//#region src/main.ts
const MAX_CONCURRENCY = 256;
const SCRIPTS_FOLDER = "script";
const JSON_FOLDER = "json";
async function updatePackage(options) {
	const resolvedUrls = (await options.urls()).map((url) => resolveValuePlaceholders(url, {
		...options.templateValues,
		version: options.version
	}));
	const { releaseNotes: manifestReleaseNotes, releaseNotesUrl } = await resolveReleaseNotes(options.releaseNotes, options.packageIdentifier, options.version, options.githubTag, options.github, options.templateValues);
	options.logger.details(options.version, resolvedUrls);
	const updateResult = await updateVersion({
		packageIdentifier: options.packageIdentifier,
		version: options.version,
		urls: resolvedUrls,
		replace: options.replace ? "latest" : void 0,
		releaseNotes: manifestReleaseNotes,
		releaseNotesUrl,
		installerMatches: options.installerMatches,
		dryRun: Boolean(process.env.DRY_RUN),
		token: process.env.GITHUB_TOKEN
	});
	options.logger.logUpdateResult(updateResult);
	if (options.replace) await closeAllButMostRecentPR(options.packageIdentifier);
	return updateResult;
}
async function handleScriptShard(file, logger) {
	const shard = await file.import();
	const { version, urls, releaseNotes, replace, skipPrCheck, state, installerMatches } = ScriptShardResult.parse(await shard.default());
	const packageIdentifier = file.name.replace(".ts", "");
	if (state && await isStateMatching(packageIdentifier, state)) {
		logger.stateMatches();
		return null;
	}
	const resolvedVersion = vs(typeof version === "function" ? version() : version);
	if (!skipPrCheck && await checkVersionInRepo(resolvedVersion, packageIdentifier, logger)) return null;
	const updateResult = await updatePackage({
		packageIdentifier,
		version: resolvedVersion,
		urls,
		releaseNotes,
		installerMatches,
		replace,
		logger
	});
	if (state) await updateVersionState(packageIdentifier, state);
	return updateResult;
}
async function resolveJsonShard(shard, initialUrls) {
	switch (shard.strategy) {
		case "github-release": {
			const latest = shard.github.fetchUrlsFromApi || shard.github.preRelease || shard.github.tagFilter || shard.github.fetchLatest ? await getLatestRelease({
				owner: shard.github.owner,
				repo: shard.github.repo,
				kind: shard.github.preRelease ? "prerelease" : "stable",
				tagIncludes: shard.github.tagFilter,
				useLatestEndpoint: shard.github.fetchLatest,
				perPage: shard.github.perPage
			}) : await getLatestReleaseFromRedirect({
				owner: shard.github.owner,
				repo: shard.github.repo
			});
			return {
				version: latest.version,
				urls: () => {
					const releaseUrls = shard.github.fetchUrlsFromApi ? latest.urls() : [];
					if (shard.github.fetchUrlsFromApi && releaseUrls.length === 0) throw new Error("No URLs found in GitHub release");
					return initialUrls.concat(releaseUrls);
				},
				githubTag: latest.rawTag,
				templateValues: { github: {
					version: latest.version,
					tag: latest.tag,
					rawTag: latest.rawTag,
					title: latest.title
				} }
			};
		}
		case "electron-builder": return {
			version: await electronBuilder(shard.electronBuilder.url),
			urls: () => initialUrls
		};
		case "page-match": {
			const { version, captures } = await pageMatch(shard.pageMatch.url, new RegExp(shard.pageMatch.regex, "i"));
			return {
				version,
				urls: () => initialUrls,
				templateValues: { captures }
			};
		}
		case "sort-versions": return {
			version: await sortVersionsMatch(shard.sortVersions.url, new RegExp(shard.sortVersions.regex, "i")),
			urls: () => initialUrls
		};
		case "json": {
			const response = await ky(shard.json.url).json();
			return {
				version: vs(get(response, shard.json.path)),
				urls: () => resolveDataBackedUrls(initialUrls, response)
			};
		}
		case "redirect-match": {
			const result = await redirectMatch(shard.redirectMatch.url, new RegExp(shard.redirectMatch.regex, "i"));
			return {
				version: result.version,
				urls: () => shard.urls ? initialUrls : initialUrls.concat(result.url)
			};
		}
		case "sourceforge": return {
			version: await sourceforge(shard.sourceforge.project, shard.sourceforge.file),
			urls: () => initialUrls
		};
		case "yaml": {
			const yaml = parse(await ky(shard.yaml.url).text(), { schema: "failsafe" });
			return {
				version: vs(get(yaml, shard.yaml.path)),
				urls: () => resolveDataBackedUrls(initialUrls, yaml)
			};
		}
		case "static": return {
			version: shard.version,
			urls: () => initialUrls
		};
	}
}
async function resolveJsonShardState(state, templateValues) {
	if (!state) return;
	switch (state.source) {
		case "value": return resolveValuePlaceholders(state.value, templateValues);
		case "response-header": {
			const value = (await ky(resolveValuePlaceholders(state.url, templateValues), { method: state.method ?? "head" })).headers.get(state.header);
			if (!value) throw new Error(`No ${state.header} header found`);
			return value;
		}
	}
}
async function handleJsonShard(file, logger) {
	const shard = JsonShardSchema.parse(await file.json());
	const packageIdentifier = file.name.replace(".json", "");
	const resolvedShard = await resolveJsonShard(shard, shard.urls ?? []);
	const version = normalizeVersion(shard.version ?? resolvedShard.version, shard.versionRemove);
	const templateValues = {
		..."templateValues" in resolvedShard ? resolvedShard.templateValues : void 0,
		version
	};
	const state = await resolveJsonShardState(shard.state, templateValues);
	if (state && await isStateMatching(packageIdentifier, state)) {
		logger.stateMatches();
		return null;
	}
	if (await checkVersionInRepo(version, packageIdentifier, logger)) return null;
	const updateResult = await updatePackage({
		packageIdentifier,
		version,
		urls: resolvedShard.urls,
		releaseNotes: shard.releaseNotes,
		replace: shard.replace,
		installerMatches: shard.installerMatches,
		logger,
		githubTag: resolvedShard.githubTag,
		github: shard.strategy === "github-release" ? {
			owner: shard.github.owner,
			repo: shard.github.repo
		} : void 0,
		templateValues
	});
	if (state) await updateVersionState(packageIdentifier, state);
	return updateResult;
}
async function executeShard(file) {
	const logger = new Logger();
	const start = performance.now();
	logger.run(file.name);
	try {
		if (file.name.endsWith("ts")) return {
			identifier: file.name,
			updateResult: await handleScriptShard(file, logger)
		};
		else return {
			identifier: file.name,
			updateResult: await handleJsonShard(file, logger)
		};
	} catch (e) {
		logger.error(file.name, e);
		throw e;
	} finally {
		logger.duration(file.name, performance.now() - start);
		logger.blankLine();
		logger.flush();
	}
}
async function runAllShards(testShards, shardsDirectory = getShardsDirectory()) {
	async function listShards(directory) {
		const ref = fs.ref(directory);
		return await ref.exists() ? ref.list() : [];
	}
	const scripts = await listShards(join(shardsDirectory, SCRIPTS_FOLDER));
	const json = await listShards(join(shardsDirectory, JSON_FOLDER));
	let shards = scripts.concat(json).filter((file) => file.extension !== ".disabled");
	if (testShards) shards = shards.filter((shard) => testShards.includes(shard.base));
	if (shards.length === 0) {
		console.log(ansis.red`Error: No shards found`);
		process.exit(1);
	}
	console.log(`Found ${shards.length} shards to run\n`);
	const results = await Promise.allSettled(shards.map(limitAsync(executeShard, MAX_CONCURRENCY)));
	const failures = results.flatMap((result, i) => {
		const file = shards[i];
		if (result.status !== "rejected" || !file) return [];
		return [{
			result,
			file
		}];
	});
	const completed = `✅ Run completed: ${shards.length - failures.length}/${shards.length} shards successful`;
	if (process.env.GITHUB_STEP_SUMMARY) {
		const generatedManifests = results.flatMap((result) => {
			if (result.status !== "fulfilled") return [];
			const updateResult = result.value.updateResult;
			if (!updateResult || updateResult.changes.length === 0) return [];
			return [updateResult];
		});
		const runErrors = failures.map((failedShard) => `### ❌ Error in ${failedShard.file.name}\n\`\`\`\n${ansis.strip(failedShard.result.reason.message)}\n\`\`\`\n`).join("");
		const summarySections = [
			"# Summary",
			"",
			completed
		];
		if (generatedManifests.length > 0) {
			summarySections.push("", "## Generated Manifests", "");
			for (const update of generatedManifests) {
				summarySections.push(`### ${update.packageIdentifier}`, `Version: ${update.version}`, `Pull Request: ${update.pullRequestUrl ?? "Dry Run"}`, "", "<details>", "<summary>Manifests</summary>", "");
				for (const manifest of update.changes) summarySections.push(`#### ${manifest.path}`, "", "```yaml", manifest.content.trimEnd(), "```", "");
				summarySections.push("</details>", "");
			}
		}
		if (runErrors) summarySections.push("", "## Run Errors", "", runErrors);
		const summary = summarySections.join("\n");
		await fs.ref(process.env.GITHUB_STEP_SUMMARY).write(summary);
	}
	console.log(completed);
	return failures.length;
}
//#endregion
//#region src/test.ts
const args = process.argv.slice(2);
const dryRunIndex = args.indexOf("--dry-run");
if (dryRunIndex !== -1) {
	process.env.DRY_RUN = "true";
	args.splice(dryRunIndex, 1);
}
const shards = args.flatMap((arg) => vs(arg).split(" "));
if (shards.length === 0) throw new Error("At least one package ID or \"all\" is required");
if (await runAllShards(shards.includes("all") ? void 0 : shards) > 0) process.exit(1);
//#endregion
export {};
