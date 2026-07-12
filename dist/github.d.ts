//#region src/github.d.ts
declare const githubClient: import("@octokit/core").Octokit & {
  paginate: import("@octokit/plugin-paginate-rest").PaginateInterface;
} & import("@octokit/plugin-paginate-graphql").paginateGraphQLInterface & import("@octokit/plugin-rest-endpoint-methods").Api & {
  retry: {
    retryRequest: (error: import("octokit").RequestError, retries: number, retryAfter: number) => import("octokit").RequestError;
  };
};
type GitHubRepository = {
  owner: string;
  repo: string;
};
type LatestReleaseOptions = GitHubRepository & {
  kind?: 'stable' | 'prerelease' | 'all';
  tagIncludes?: string;
  useLatestEndpoint?: boolean;
  perPage?: number;
};
declare function getLatestReleaseFromRedirect({ owner, repo, tagIncludes }: GitHubRepository & {
  tagIncludes?: string;
}): Promise<{
  version: string;
  tag: string;
  rawTag: string;
  title: undefined;
  assetNames: () => never[];
  urls: () => never[];
}>;
declare function getLatestRelease(options: LatestReleaseOptions): Promise<{
  version: string;
  tag: string;
  rawTag: string;
  title: string | null;
  assetNames: () => string[];
  urls: () => string[];
}>;
declare function getReleaseByTag(options: GitHubRepository & {
  tag: string;
}): Promise<{
  url: string;
  html_url: string;
  assets_url: string;
  upload_url: string;
  tarball_url: string | null;
  zipball_url: string | null;
  id: number;
  node_id: string;
  tag_name: string;
  target_commitish: string;
  name: string | null;
  body?: string | null;
  draft: boolean;
  prerelease: boolean;
  immutable?: boolean;
  created_at: string;
  published_at: string | null;
  updated_at?: string | null;
  author: import("@octokit/openapi-types").components["schemas"]["simple-user"];
  assets: import("@octokit/openapi-types").components["schemas"]["release-asset"][];
  body_html?: string;
  body_text?: string;
  mentions_count?: number;
  discussion_url?: string;
  reactions?: import("@octokit/openapi-types").components["schemas"]["reaction-rollup"];
}>;
declare function getRepositoryHeadSha(): Promise<string>;
//#endregion
export { getLatestRelease, getLatestReleaseFromRedirect, getReleaseByTag, getRepositoryHeadSha, githubClient };