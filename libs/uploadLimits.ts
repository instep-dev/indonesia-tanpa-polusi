// Vercel Serverless Functions hard-reject any request body over 4.5MB
// (FUNCTION_PAYLOAD_TOO_LARGE) before our route handler ever runs — that
// limit can't be raised via config. Multipart form-data adds a bit of
// overhead on top of the raw file, so the app-level limit is kept a step
// below that platform ceiling.
export const MAX_UPLOAD_SIZE_MB = 4
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024
