export async function measureDevelopmentAsync<T>(
  label: string,
  operation: () => Promise<T>,
) {
  if (!__DEV__) {
    return operation();
  }

  const startedAt = Date.now();

  try {
    return await operation();
  } finally {
    console.debug(`[Performance] ${label}: ${Date.now() - startedAt}ms`);
  }
}
