// End-to-end tests write to the database (editor flows create/delete content),
// so they must NEVER run against the live Neon database. Every e2e entry point
// (Playwright config, seed script) calls this first and aborts otherwise.

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

export const assertLocalDatabase = (databaseUrl: string | undefined): void => {
  if (!databaseUrl) {
    throw new Error(
      'e2e: DATABASE_URL is not set. Point it at a LOCAL throwaway Postgres, e.g. postgresql://test@127.0.0.1:54329/itp_test',
    )
  }

  let host: string
  try {
    host = new URL(databaseUrl).hostname
  } catch {
    throw new Error('e2e: DATABASE_URL is not a valid URL')
  }

  if (!LOCAL_HOSTS.has(host) || /neon\.tech/i.test(databaseUrl)) {
    throw new Error(`e2e: refusing to run against non-local database host "${host}". Tests only run against localhost.`)
  }
}
