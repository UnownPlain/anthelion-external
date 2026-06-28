import { ReleaseNotesSource } from "./release-notes.js";
import { z } from "zod";

//#region src/schema/script-shard.d.ts
declare const urlsSchema: z.ZodPipe<z.ZodUnion<readonly [z.ZodArray<z.ZodPipe<z.ZodOptional<z.ZodNullable<z.ZodString>>, z.ZodTransform<string, string | null | undefined>>>, z.ZodCustom<() => Array<string | null | undefined> | Promise<Array<string | null | undefined>> | undefined, () => Array<string | null | undefined> | Promise<Array<string | null | undefined>> | undefined>]>, z.ZodTransform<(() => Promise<string[]>) | (() => string[]), string[] | (() => Array<string | null | undefined> | Promise<Array<string | null | undefined>> | undefined)>>;
type Urls = z.output<typeof urlsSchema>;
declare const ScriptShardResult: z.ZodUnion<readonly [z.ZodObject<{
  urls: z.ZodPipe<z.ZodUnion<readonly [z.ZodArray<z.ZodPipe<z.ZodOptional<z.ZodNullable<z.ZodString>>, z.ZodTransform<string, string | null | undefined>>>, z.ZodCustom<() => Array<string | null | undefined> | Promise<Array<string | null | undefined>> | undefined, () => Array<string | null | undefined> | Promise<Array<string | null | undefined>> | undefined>]>, z.ZodTransform<(() => Promise<string[]>) | (() => string[]), string[] | (() => Array<string | null | undefined> | Promise<Array<string | null | undefined>> | undefined)>>;
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
  installerMatches: z.ZodOptional<z.ZodArray<z.ZodString>>;
  version: z.ZodPipe<z.ZodCustom<() => string | undefined, () => string | undefined>, z.ZodTransform<() => string, () => string | undefined>>;
  state: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
  urls: z.ZodPipe<z.ZodUnion<readonly [z.ZodArray<z.ZodPipe<z.ZodOptional<z.ZodNullable<z.ZodString>>, z.ZodTransform<string, string | null | undefined>>>, z.ZodCustom<() => Array<string | null | undefined> | Promise<Array<string | null | undefined>> | undefined, () => Array<string | null | undefined> | Promise<Array<string | null | undefined>> | undefined>]>, z.ZodTransform<(() => Promise<string[]>) | (() => string[]), string[] | (() => Array<string | null | undefined> | Promise<Array<string | null | undefined>> | undefined)>>;
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
  installerMatches: z.ZodOptional<z.ZodArray<z.ZodString>>;
  version: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string, string | undefined>>;
  state: z.ZodOptional<z.ZodUndefined>;
}, z.core.$strip>]>;
type ScriptShardResultInput = z.input<typeof ScriptShardResult>;
type ScriptShard = () => ScriptShardResultInput | Promise<ScriptShardResultInput>;
declare function defineShard<const T extends ScriptShard>(shard: T): T;
//#endregion
export { ScriptShard, ScriptShardResult, ScriptShardResultInput, Urls, defineShard, urlsSchema };