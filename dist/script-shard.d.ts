import { ReleaseNotesSource } from "./release-notes.js";
import { z } from "zod";
//#region src/schema/script-shard.d.ts
declare const urlsSchema: z.ZodPipe<z.ZodFunction<z.ZodTuple<readonly [], null>, z.ZodUnknown>, z.ZodTransform<() => Promise<(string | {
  url: string;
  architecture?: "arm" | "arm64" | "neutral" | "x64" | "x86" | undefined;
  nestedInstallerMatches?: string[] | undefined;
})[]>, z.core.$InferOuterFunctionType<z.ZodTuple<readonly [], null>, z.ZodUnknown>>>;
type Urls = z.output<typeof urlsSchema>;
declare const ScriptShardResult: z.ZodObject<{
  urls: z.ZodPipe<z.ZodFunction<z.ZodTuple<readonly [], null>, z.ZodUnknown>, z.ZodTransform<() => Promise<(string | {
    url: string;
    architecture?: "arm" | "arm64" | "neutral" | "x64" | "x86" | undefined;
    nestedInstallerMatches?: string[] | undefined;
  })[]>, z.core.$InferOuterFunctionType<z.ZodTuple<readonly [], null>, z.ZodUnknown>>>;
  releaseNotes: z.ZodOptional<z.ZodUnion<readonly [z.ZodDiscriminatedUnion<[z.ZodObject<{
    source: z.ZodLiteral<ReleaseNotesSource.Html>;
    sourceUrl: z.ZodString;
    releaseNotesUrl: z.ZodOptional<z.ZodString>;
    characterLimit: z.ZodOptional<z.ZodInt>;
    cleanup: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
  }, z.core.$strip>, z.ZodObject<{
    source: z.ZodLiteral<ReleaseNotesSource.Markdown>;
    sourceUrl: z.ZodString;
    releaseNotesUrl: z.ZodOptional<z.ZodString>;
    characterLimit: z.ZodOptional<z.ZodInt>;
    cleanup: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
  }, z.core.$strip>, z.ZodObject<{
    source: z.ZodLiteral<ReleaseNotesSource.PlainText>;
    sourceUrl: z.ZodString;
    releaseNotesUrl: z.ZodOptional<z.ZodString>;
    characterLimit: z.ZodOptional<z.ZodInt>;
    cleanup: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
  }, z.core.$strip>, z.ZodObject<{
    source: z.ZodLiteral<ReleaseNotesSource.BrowserRendering>;
    sourceUrl: z.ZodString;
    releaseNotesUrl: z.ZodOptional<z.ZodString>;
    characterLimit: z.ZodOptional<z.ZodInt>;
    waitUntil: z.ZodOptional<z.ZodEnum<{
      domcontentloaded: "domcontentloaded";
      load: "load";
      networkidle0: "networkidle0";
      networkidle2: "networkidle2";
    }>>;
    waitForSelector: z.ZodOptional<z.ZodString>;
    cleanup: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
  }, z.core.$strip>, z.ZodObject<{
    source: z.ZodLiteral<ReleaseNotesSource.Github>;
    owner: z.ZodOptional<z.ZodString>;
    repo: z.ZodOptional<z.ZodString>;
    tag: z.ZodOptional<z.ZodString>;
    cleanup: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
  }, z.core.$strip>, z.ZodObject<{
    source: z.ZodLiteral<ReleaseNotesSource.Json>;
    sourceUrl: z.ZodURL;
    releaseNotesUrl: z.ZodOptional<z.ZodString>;
    path: z.ZodString;
    nestedSource: z.ZodEnum<{
      html: ReleaseNotesSource.Html;
      markdown: ReleaseNotesSource.Markdown;
      "plain-text": ReleaseNotesSource.PlainText;
    }>;
    cleanup: z.ZodOptional<z.ZodBoolean>;
  }, z.core.$strip>, z.ZodObject<{
    source: z.ZodLiteral<ReleaseNotesSource.Yaml>;
    sourceUrl: z.ZodURL;
    releaseNotesUrl: z.ZodOptional<z.ZodString>;
    path: z.ZodString;
    nestedSource: z.ZodEnum<{
      html: ReleaseNotesSource.Html;
      markdown: ReleaseNotesSource.Markdown;
      "plain-text": ReleaseNotesSource.PlainText;
    }>;
    cleanup: z.ZodOptional<z.ZodBoolean>;
  }, z.core.$strip>], "source">, z.ZodObject<{
    releaseNotesUrl: z.ZodString;
  }, z.core.$strict>]>>;
  replace: z.ZodOptional<z.ZodBoolean>;
  skipPrCheck: z.ZodDefault<z.ZodBoolean>;
  ignoreOtherPrs: z.ZodDefault<z.ZodBoolean>;
  version: z.ZodPipe<z.ZodUnknown, z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
    source: z.ZodLiteral<"explicit">;
    value: z.ZodString;
  }, z.core.$strip>, z.ZodObject<{
    source: z.ZodEnum<{
      display: "display";
      file: "file";
      product: "product";
    }>;
  }, z.core.$strip>]>>;
  state: z.ZodOptional<z.ZodPipe<z.ZodUnknown, z.ZodString>>;
}, z.core.$strip>;
type ScriptShardResultInput = z.input<typeof ScriptShardResult>;
type ScriptShard = () => Promise<ScriptShardResultInput>;
type Exact<Actual, Expected> = Actual extends Expected ? Actual & Record<Exclude<keyof Actual, keyof Expected>, never> : never;
declare function defineShard<const Result extends ScriptShardResultInput>(shard: () => Promise<Exact<Result, ScriptShardResultInput>>): typeof shard;
//#endregion
export { ScriptShard, ScriptShardResult, ScriptShardResultInput, Urls, defineShard, urlsSchema };