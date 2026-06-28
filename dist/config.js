import { resolve } from "node:path";
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
export { getShardsDirectory, getTargetRepository };
