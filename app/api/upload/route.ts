import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { validateAccessToken, validateSuperAdminAccessToken } from '@/libs/validateToken'
import { uploadImageToR2 } from '@/libs/r2'
import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_MB } from '@/libs/uploadLimits'
import { Jimp } from 'jimp'
import { applyExifOrientation, isGifBuffer, readExifOrientation } from '@/libs/imageProcessing'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// Journalist-uploaded originals (straight off a phone camera) can be 3-4MB+
// even under the upload cap, which is enough to blow past what Vercel's
// on-request image optimizer will fetch/buffer — resize and recompress once
// here at upload time so what lands in R2 (and every later request) is
// already small, instead of relying on downstream optimization.
const MAX_DIMENSION_PX = 2000
const JPEG_QUALITY = 82

const ALLOWED_FOLDERS = ['articles', 'site'] as const
type UploadFolder = (typeof ALLOWED_FOLDERS)[number]

const isUploadFolder = (value: unknown): value is UploadFolder =>
  typeof value === 'string' && (ALLOWED_FOLDERS as readonly string[]).includes(value)

// POST /api/upload — uploads an image to R2 and returns its public URL.
//  - Journalists upload article covers/gallery photos (folder `articles`, the default).
//  - Super-admins upload CMS site content (folder `site`) and may also use `articles`.
export const POST = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const journalist = await validateAccessToken(request, db)
    const superAdmin = journalist.ok ? null : await validateSuperAdminAccessToken(request, db)
    if (!journalist.ok && !superAdmin?.ok) return journalist.response

    const formData = await request.formData()
    const file = formData.get('file')
    const folderField = formData.get('folder') ?? 'articles'

    if (!isUploadFolder(folderField)) {
      return NextResponse.json({ error: 'Invalid folder' }, { status: 400 })
    }
    // Site content is super-admin only; journalists are limited to article uploads.
    if (folderField === 'site' && !superAdmin?.ok) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const actorId = journalist.ok ? journalist.userId : superAdmin?.ok ? superAdmin.superAdminId : ''

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
    if (file.type === 'image/gif') {
      // Passed through untouched, so verify the bytes really are a GIF
      // instead of trusting the client-declared MIME type.
      if (!isGifBuffer(rawBuffer)) {
        return NextResponse.json({ error: 'File is not a valid GIF image' }, { status: 400 })
      }
    } else {
      try {
        const image = await Jimp.read(rawBuffer)
        // Re-encoding drops the EXIF tag, so apply the rotation to the pixels first.
        applyExifOrientation(image, await readExifOrientation(rawBuffer))
        const { width, height } = image.bitmap

        if (width > MAX_DIMENSION_PX || height > MAX_DIMENSION_PX) {
          if (width > height) {
            image.resize({ w: MAX_DIMENSION_PX })
          } else {
            image.resize({ h: MAX_DIMENSION_PX })
          }
        }

        const jimpBuffer = await image.getBuffer('image/jpeg', { quality: JPEG_QUALITY })
        buffer = Buffer.from(jimpBuffer)
        contentType = 'image/jpeg'
      } catch (err: any) {
        console.error('Jimp processing error:', err)
        return NextResponse.json({ error: `Could not process image: ${err.message}` }, { status: 400 })
      }
    }

    let url: string
    try {
      url = await uploadImageToR2(buffer, contentType, `${folderField}/${actorId}`)
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
