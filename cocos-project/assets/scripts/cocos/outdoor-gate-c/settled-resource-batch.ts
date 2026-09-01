export interface SettledResource<T> {
  readonly path: string;
  readonly resource: T;
}

export async function loadSettledResourceBatch<T>(
  paths: readonly string[],
  load: (path: string) => Promise<T>,
  release: (path: string, resource: T) => void,
): Promise<readonly SettledResource<T>[]> {
  const results = await Promise.allSettled(paths.map(async (path) => ({
    path,
    resource: await load(path),
  })));
  const failure = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
  if (failure) {
    for (const result of results) {
      if (result.status === "fulfilled") release(result.value.path, result.value.resource);
    }
    throw failure.reason;
  }
  return results.map((result) => (result as PromiseFulfilledResult<SettledResource<T>>).value);
}
