import { z } from "zod";
import { Komac } from "@unownplain/anthelion-komac";
import { LanguageModel } from "ai";
declare const configSchema: z.ZodObject<{
  shardsDirectory: z.ZodDefault<z.ZodString>;
  concurrency: z.ZodDefault<z.ZodInt>;
  dryRunConcurrency: z.ZodDefault<z.ZodInt>;
  downloadConcurrency: z.ZodOptional<z.ZodInt>;
  dryRun: z.ZodOptional<z.ZodBoolean>;
  stepSummary: z.ZodOptional<z.ZodString>;
  github: z.ZodOptional<z.ZodObject<{
    token: z.ZodOptional<z.ZodString>;
    forkOwner: z.ZodOptional<z.ZodString>;
    repository: z.ZodOptional<z.ZodObject<{
      owner: z.ZodString;
      repo: z.ZodString;
      branch: z.ZodString;
    }, z.core.$strip>>;
    targetRepository: z.ZodOptional<z.ZodObject<{
      owner: z.ZodString;
      repo: z.ZodString;
      branch: z.ZodString;
    }, z.core.$strip>>;
  }, z.core.$strip>>;
  browserRendering: z.ZodOptional<z.ZodObject<{
    accountId: z.ZodString;
    apiToken: z.ZodOptional<z.ZodString>;
  }, z.core.$strip>>;
  releaseNotes: z.ZodOptional<z.ZodObject<{
    model: z.ZodCustom<(() => LanguageModel) | LanguageModel, (() => LanguageModel) | LanguageModel>;
    concurrency: z.ZodDefault<z.ZodInt>;
  }, z.core.$strip>>;
}, z.core.$strip>;
export type AnthelionConfig = z.input<typeof configSchema>;
export declare const config: {
  shardsDirectory: string;
  concurrency: number;
  dryRunConcurrency: number;
  downloadConcurrency?: number | undefined;
  releaseNotes?: {
    model: (() => LanguageModel) | LanguageModel;
    concurrency: number;
  } | undefined;
  dryRun: boolean;
  stepSummary: string | undefined;
  github: {
    token: string | undefined;
    forkOwner: string | undefined;
    repository: {
      owner: string;
      repo: string;
      branch: string;
    } | undefined;
    targetRepository: {
      owner: string;
      repo: string;
      branch: string;
    };
  };
  browserRendering: {
    accountId: string;
    apiToken: string | undefined;
  } | undefined;
};
export type ResolvedAnthelionConfig = typeof config;
export declare const githubClient: import("@octokit/core").Octokit & {
  paginate: import("@octokit/plugin-paginate-rest").PaginateInterface;
} & import("@octokit/plugin-paginate-graphql").paginateGraphQLInterface & import("@octokit/plugin-rest-endpoint-methods").Api & {
  retry: {
    retryRequest: (error: import("octokit").RequestError, retries: number, retryAfter: number) => import("octokit").RequestError;
  };
};
export declare const komac: Komac;
export {};