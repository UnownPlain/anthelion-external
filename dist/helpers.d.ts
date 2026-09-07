import { Komac, PullRequest, UpdatePackageRequest, UpdatePackageResult } from "@unownplain/anthelion-komac";
//#region src/helpers.d.ts
export declare const komac: Komac;
export declare class Logger {
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
export declare function compareVersions(a: string, b: string): number;
export declare function parseString(value: unknown): string;
export declare function getShardTarget(shardName: string): {
  packageIdentifier: string;
  font: boolean;
};
export declare function getPath(value: unknown, path: string, defaultValue?: unknown): unknown;
export declare function isHttpUrl(value: string): boolean;
export declare function resolveValuePlaceholders(template: string, values: Record<string, unknown>): string;
export declare function match(value: unknown, regex: RegExp, errorMessage?: string): {
  groups: [string, ...string[]];
  captures: {
    [key: string]: string;
  };
};
export declare function isStateMatching(options: {
  packageIdentifier: string;
  state: string;
  ignoreQuotes?: boolean;
}): Promise<boolean | undefined>;
export declare function checkVersionInRepo(options: {
  version: string;
  packageIdentifier: string;
  logger?: Logger;
  font?: boolean;
  ignoreOtherPrs?: boolean;
}): Promise<boolean>;
export declare function updateVersionState(options: {
  packageIdentifier: string;
  state: string;
}): Promise<void>;
export declare function normalizeVersion(version: string, remove?: string): string;
export declare function resolveDataBackedUrls(options: {
  installers: UpdatePackageRequest['installers'];
  data: unknown;
}): (string | {
  architecture?: 'x86' | 'x64' | 'arm' | 'arm64' | 'neutral';
  nestedInstallerMatches?: Array<string>;
  url: string;
})[];
type TemplateValue = string | number | bigint | boolean | null | undefined;
export declare function dedent(strings: TemplateStringsArray, ...values: TemplateValue[]): string;
//#endregion