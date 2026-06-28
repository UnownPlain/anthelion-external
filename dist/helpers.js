import { getTargetRepository } from "./config.js";
import { getRepositoryHeadSha, githubClient } from "./github.js";
import { ZodError, z } from "zod";
import ky from "ky";
import fs from "@rcompat/fs";
import { getExistingPullRequest } from "@unownplain/anthelion-komac";
import { bgRed, blue, green, magenta, redBright, yellow } from "ansis";
import { delay } from "es-toolkit";
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
export { Logger, checkVersionInRepo, closeAllButMostRecentPR, compareVersions, dedent, firstMatch, get, isHttpUrl, isStateMatching, match, normalizeVersion, resolveDataBackedUrls, resolveValuePlaceholders, updateVersionState, vs };
