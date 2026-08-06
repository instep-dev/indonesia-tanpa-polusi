import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { validateAccessToken } from '@/libs/validateToken'
import { uploadImageToR2 } from '@/libs/r2'
import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_MB } from '@/libs/uploadLimits'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// POST /api/upload — journalist uploads an image (cover or article gallery
// photo) to R2. Returns the public URL to store on the Article/ArticleImage.
export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const auth = await validateAccessToken(request, db)
  if (!auth.ok) return auth.response

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Only JPEG, PNG, WEBP, or GIF images are allowed' },
      { status: 400 },
    )
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return NextResponse.json({ error: `File exceeds ${MAX_UPLOAD_SIZE_MB}MB limit` }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const url = await uploadImageToR2(buffer, file.type, `articles/${auth.userId}`)

  return NextResponse.json({ url }, { status: 201 })
}
