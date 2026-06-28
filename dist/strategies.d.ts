//#region src/strategies.d.ts
declare function electronBuilder(url: string): Promise<string>;
declare function pageMatch(url: string, regex: RegExp): Promise<{
  version: string;
  captures: {
    [key: string]: string;
  };
}>;
declare function redirectMatch(url: string, regex: RegExp): Promise<{
  version: string;
  url: string;
}>;
declare function sortVersions(str: string, regex: RegExp): string | undefined;
declare function sortVersionsMatch(url: string, regex: RegExp): Promise<string>;
declare function sourceforge(projectName: string, fileName?: string): Promise<string>;
//#endregion
export { electronBuilder, pageMatch, redirectMatch, sortVersions, sortVersionsMatch, sourceforge };