//#region src/config.d.ts
declare function getShardsDirectory(): string;
declare function getTargetRepository(): {
  owner: string;
  repo: string;
  branch: string;
};
//#endregion
export { getShardsDirectory, getTargetRepository };