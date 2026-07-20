import { ExistingPullRequestResult, UpdateVersionResult } from "@unownplain/anthelion-komac";
//#region src/helpers.d.ts
declare class Logger {
  private logs;
  log(line: string): void;
  blankLine(): void;
  logUpdateResult(result: UpdateVersionResult): void;
  stateMatches(): void;
  flush(): void;
  run(shard: string): void;
  duration(shard: string, milliseconds: number): void;
  present(version: string): void;
  prExists(pr: ExistingPullRequestResult): void;
  error(shard: string, error: unknown): void;
  details(version: string, urls: string[]): void;
}
declare function compareVersions(a: string, b: string): number;
declare function vs(str: unknown): string;
declare function getShardTarget(shardName: string): {
  packageIdentifier: string;
  font: boolean;
};
declare function get(obj: unknown, path: string, defaultValue?: unknown): unknown;
declare function isHttpUrl(value: string): boolean;
declare function resolveValuePlaceholders(template: string, values: Record<string, unknown>): string;
declare function match(str: string | undefined, regex: RegExp): string[];
declare function isStateMatching(packageIdentifier: string, newState: string): Promise<boolean | undefined>;
declare function checkVersionInRepo(version: string, packageIdentifier: string, logger?: Logger, font?: boolean, ignoreOtherPrs?: boolean): Promise<boolean>;
declare function updateVersionState(packageIdentifier: string, latestVersion: string): Promise<void>;
declare function normalizeVersion(version: string, remove?: string): string;
declare function resolveDataBackedUrls(urls: string[], data: unknown): string[];
declare function firstMatch(str: string, regex: RegExp, errorMessage?: string): string;
type TemplateValue = string | number | bigint | boolean | null | undefined;
declare function dedent(strings: TemplateStringsArray, ...values: TemplateValue[]): string;
//#endregion
export { Logger, checkVersionInRepo, compareVersions, dedent, firstMatch, get, getShardTarget, isHttpUrl, isStateMatching, match, normalizeVersion, resolveDataBackedUrls, resolveValuePlaceholders, updateVersionState, vs };