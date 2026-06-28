import { compareVersions, firstMatch, vs } from "./helpers.js";
import ky from "ky";
import { parse } from "yaml";
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
export { electronBuilder, pageMatch, redirectMatch, sortVersions, sortVersionsMatch, sourceforge };
