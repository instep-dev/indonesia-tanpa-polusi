import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type ParsedBody<T> = { ok: true; body: T }
type InvalidBody = { ok: false; response: NextResponse }

// Guards every route's `request.json()` call — an aborted/truncated request
// (client timeout mid-upload, malformed client, etc.) throws a raw
// SyntaxError otherwise, which surfaces as an unhandled crash instead of a
// clean 400.
export const parseJsonBody = async <T>(request: NextRequest): Promise<ParsedBody<T> | InvalidBody> => {
  try {
    const body = (await request.json()) as T
    return { ok: true, body }
  } catch {
    return { ok: false, response: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }
  }
}
