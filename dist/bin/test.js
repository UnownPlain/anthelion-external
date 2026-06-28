#!/usr/bin/env bun
import { i as vs, r as runAllShards } from "./main2.js";
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
