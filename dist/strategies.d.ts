//#region src/strategies.d.ts
type MatchStrategyOptions = {
  url: string;
  regex: string | RegExp;
};
type VersionStrategyResult = {
  version: string;
};
declare function electronBuilder(options: {
  url: string;
}): Promise<VersionStrategyResult>;
declare function pageMatch(options: MatchStrategyOptions): Promise<{
  version: string;
  groups: [string, ...string[]];
  captures: {
    [key: string]: string;
  };
}>;
declare function redirectMatch(options: MatchStrategyOptions & {
  method?: 'head' | 'get';
}): Promise<{
  version: string;
  url: string;
}>;
declare function sortVersions(options: MatchStrategyOptions): Promise<VersionStrategyResult>;
declare function sourceforge(options: {
  project: string;
  file?: string;
}): Promise<VersionStrategyResult>;
//#endregion
export { MatchStrategyOptions, VersionStrategyResult, electronBuilder, pageMatch, redirectMatch, sortVersions, sourceforge };