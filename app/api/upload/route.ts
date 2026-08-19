import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { validateAccessToken } from '@/libs/validateToken'
import { uploadImageToR2 } from '@/libs/r2'
import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_MB } from '@/libs/uploadLimits'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// Journalist-uploaded originals (straight off a phone camera) can be 3-4MB+
// even under the upload cap, which is enough to blow past what Vercel's
// on-request image optimizer will fetch/buffer — resize and recompress once
// here at upload time so what lands in R2 (and every later request) is
// already small, instead of relying on downstream optimization.
const MAX_DIMENSION_PX = 2000
const JPEG_QUALITY = 82

// POST /api/upload — journalist uploads an image (cover or article gallery
// photo) to R2. Returns the public URL to store on the Article/ArticleImage.
export const POST = async (request: NextRequest): Promise<NextResponse> => {
  try {
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

    const rawBuffer = Buffer.from(await file.arrayBuffer())

    // Animated GIFs lose their animation if run through this pipeline —
    // leave them untouched (rare upload, already gated by MAX_UPLOAD_SIZE_BYTES).
    let buffer = rawBuffer
    let contentType = file.type
    if (file.type !== 'image/gif') {
      let sharpInstance: any
      try {
        const sharpModule = await import('sharp')
        sharpInstance = sharpModule.default
      } catch (err: any) {
        console.error('Failed to load sharp module:', err)
        return NextResponse.json(
          { error: `Image processor (sharp) failed to initialize: ${err.message}. Please check if ignoreScripts in package.json is blocking production install.` },
          { status: 500 },
        )
      }

      try {
        buffer = await sharpInstance(rawBuffer)
          .rotate() // apply EXIF orientation before stripping it
          .resize({ width: MAX_DIMENSION_PX, height: MAX_DIMENSION_PX, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: JPEG_QUALITY })
          .toBuffer()
        contentType = 'image/jpeg'
      } catch (err: any) {
        console.error('Sharp processing error:', err)
        return NextResponse.json({ error: `Could not process image: ${err.message}` }, { status: 400 })
      }
    }

    let url: string
    try {
      url = await uploadImageToR2(buffer, contentType, `articles/${auth.userId}`)
    } catch (err: any) {
      console.error('R2 upload error:', err)
      return NextResponse.json(
        { error: `Cloudflare R2 upload failed: ${err.message}. Please check credentials and bucket configuration.` },
        { status: 500 },
      )
    }

    return NextResponse.json({ url }, { status: 201 })
  } catch (err: any) {
    console.error('Unhandled upload API error:', err)
    return NextResponse.json(
      { error: `Server error during upload: ${err.message}` },
      { status: 500 },
    )
  }
}
