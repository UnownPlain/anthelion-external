import { z } from "zod";

//#region src/schema/release-notes.d.ts
declare enum ReleaseNotesSource {
  Html = "html",
  Markdown = "markdown",
  PlainText = "plain-text",
  Github = "github",
  Json = "json",
  Yaml = "yaml",
  BrowserRendering = "browser-rendering"
}
declare const releaseNotesNestedSourceSchema: z.ZodEnum<{
  html: ReleaseNotesSource.Html;
  markdown: ReleaseNotesSource.Markdown;
  "plain-text": ReleaseNotesSource.PlainText;
}>;
type NestedReleaseNotesSource = z.infer<typeof releaseNotesNestedSourceSchema>;
declare const releaseNotesSchema: z.ZodOptional<z.ZodUnion<readonly [z.ZodDiscriminatedUnion<[z.ZodObject<{
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
type ReleaseNotesInput = z.input<typeof releaseNotesSchema>;
//#endregion
export { NestedReleaseNotesSource, ReleaseNotesInput, ReleaseNotesSource, releaseNotesSchema };