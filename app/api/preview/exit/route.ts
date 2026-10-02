import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { draftMode } from 'next/headers'
import { isPreviewPath } from '@/libs/previewPath'

// GET /api/preview/exit?path=/en/… — leaves preview mode and returns to the public page.
export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const path = request.nextUrl.searchParams.get('path')
  ;(await draftMode()).disable()
  return NextResponse.redirect(new URL(isPreviewPath(path) ? path : '/', request.url))
}
