//#region src/strategies.d.ts
type MatchStrategyOptions = {
  url: string;
  regex: RegExp;
};
declare function electronBuilder(options: {
  url: string;
}): Promise<{
  version: string;
  urls: string[];
}>;
declare function tauri(options: {
  url: string;
  platforms?: string[];
}): Promise<{
  version: string;
  urls: string[];
  data: {
    version: string;
    platforms: Record<string, {
      url: string;
    }>;
  };
}>;
declare function toDesktop(options: {
  appId: string;
}): Promise<{
  version: string;
  urls: string[];
  data: {
    version: string;
    artifacts: Record<string, unknown>;
  };
}>;
declare function msDownloadCenter(options: {
  id: number;
  regex?: RegExp;
}): Promise<{
  version: string;
  urls: string[];
  data: {
    dlcDetailsView: {
      downloadFile: {
        name: string;
        url: string;
        version: string;
      }[];
    };
  };
}>;
declare function pageMatch(options: MatchStrategyOptions): Promise<{
  version: string;
  groups: [string, ...string[]];
  captures: {
    [key: string]: string;
  };
}>;
declare function redirectMatch(options: Omit<MatchStrategyOptions, 'url'> & {
  url: string[];
  method?: 'head' | 'get';
}): Promise<{
  version: string;
  urls: string[];
  captures: {
    [key: string]: string;
  };
}>;
declare function sortVersions(options: MatchStrategyOptions): Promise<{
  version: string;
}>;
declare function sourceforge(options: {
  project: string;
  file?: string;
}): Promise<{
  version: string;
}>;
//#endregion
export { MatchStrategyOptions, electronBuilder, msDownloadCenter, pageMatch, redirectMatch, sortVersions, sourceforge, tauri, toDesktop };