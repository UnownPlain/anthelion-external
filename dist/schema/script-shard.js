import { releaseNotesSchema } from "./release-notes.js";
import { z } from "zod";
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
function defineShard(shard) {
	return shard;
}
//#endregion
export { ScriptShardResult, defineShard, urlsSchema };
