import { orientation as readOrientation } from 'exifr'
import type { Jimp } from 'jimp'

type JimpImage = Awaited<ReturnType<typeof Jimp.read>>

// Phone cameras store photos in the sensor's orientation plus an EXIF tag that
// says how to rotate them. Re-encoding through Jimp drops that tag, so the
// rotation has to be applied to the pixels first or portrait photos end up
// sideways. (Pure JS on purpose: `sharp` did this natively but broke the
// production build — see git history, commits 6d84771 / 4bda138.)

/** EXIF orientation 1-8 (1 = upright). Anything missing/unreadable → 1. */
export const readExifOrientation = async (buffer: Buffer): Promise<number> => {
  try {
    const value = await readOrientation(buffer)
    return typeof value === 'number' && value >= 1 && value <= 8 ? value : 1
  } catch {
    return 1
  }
}

// NOTE: Jimp's `rotate(deg)` turns the image COUNTER-clockwise, so a clockwise
// quarter turn is `rotate(270)` and vice versa. (Verified by the 8-orientation
// pixel test in test/lib/image-processing.test.ts.)

/** Physically applies an EXIF orientation (1-8) so the image displays upright without the tag. */
export const applyExifOrientation = (image: JimpImage, orientation: number): void => {
  switch (orientation) {
    case 2: // mirrored horizontally
      image.flip({ horizontal: true, vertical: false })
      break
    case 3: // rotated 180°
      image.rotate(180)
      break
    case 4: // mirrored vertically
      image.flip({ horizontal: false, vertical: true })
      break
    case 5: // transposed: mirror, then 270° clockwise
      image.flip({ horizontal: true, vertical: false })
      image.rotate(90)
      break
    case 6: // 90° clockwise (the usual portrait phone photo)
      image.rotate(270)
      break
    case 7: // transversed: mirror, then 90° clockwise
      image.flip({ horizontal: true, vertical: false })
      image.rotate(270)
      break
    case 8: // 270° clockwise
      image.rotate(90)
      break
    default:
      break
  }
}

/** True when the bytes start with a GIF signature (GIF87a / GIF89a). The client-declared MIME type is not trusted. */
export const isGifBuffer = (buffer: Buffer): boolean => {
  const signature = buffer.subarray(0, 6).toString('ascii')
  return signature === 'GIF87a' || signature === 'GIF89a'
}
