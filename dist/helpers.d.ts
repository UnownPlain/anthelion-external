import { Komac, PullRequest, UpdatePackageRequest, UpdatePackageResult } from "@unownplain/anthelion-komac";
//#region src/helpers.d.ts
declare const komac: Komac;
declare class Logger {
  private logs;
  log(line: string): void;
  blankLine(): void;
  logUpdateResult(result: UpdatePackageResult): void;
  stateMatches(): void;
  flush(): void;
  run(shard: string): void;
  duration(shard: string, milliseconds: number): void;
  present(version: string): void;
  prExists(pr: PullRequest): void;
  error(shard: string, error: unknown): void;
  details(version: string, urls: string[]): void;
}
declare function compareVersions(a: string, b: string): number;
declare function parseString(value: unknown): string;
declare function getShardTarget(shardName: string): {
  packageIdentifier: string;
  font: boolean;
};
declare function getPath(value: unknown, path: string, defaultValue?: unknown): unknown;
declare function isHttpUrl(value: string): boolean;
declare function resolveValuePlaceholders(template: string, values: Record<string, unknown>): string;
declare function match(value: unknown, regex: RegExp, errorMessage?: string): {
  groups: [string, ...string[]];
  captures: {
    [key: string]: string;
  };
};
declare function isStateMatching(options: {
  packageIdentifier: string;
  state: string;
  ignoreQuotes?: boolean;
}): Promise<boolean | undefined>;
declare function checkVersionInRepo(options: {
  version: string;
  packageIdentifier: string;
  logger?: Logger;
  font?: boolean;
  ignoreOtherPrs?: boolean;
}): Promise<boolean>;
declare function updateVersionState(options: {
  packageIdentifier: string;
  state: string;
}): Promise<void>;
declare function normalizeVersion(version: string, remove?: string): string;
declare function resolveDataBackedUrls(options: {
  installers: UpdatePackageRequest['installers'];
  data: unknown;
}): (string | {
  architecture?: 'x86' | 'x64' | 'arm' | 'arm64' | 'neutral';
  nestedInstallerMatches?: Array<string>;
  url: string;
})[];
type TemplateValue = string | number | bigint | boolean | null | undefined;
declare function dedent(strings: TemplateStringsArray, ...values: TemplateValue[]): string;
//#endregion
export { Logger, checkVersionInRepo, compareVersions, dedent, getPath, getShardTarget, isHttpUrl, isStateMatching, komac, match, normalizeVersion, parseString, resolveDataBackedUrls, resolveValuePlaceholders, updateVersionState };