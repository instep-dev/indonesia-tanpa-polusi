import { Jimp } from 'jimp'
import { applyExifOrientation, isGifBuffer } from '@/libs/imageProcessing'

// A 2x3 image where every pixel has a unique colour, so any wrong rotation/flip shows up.
const W = 2
const H = 3
const colour = (x: number, y: number): number => ((x * 40 + y * 70 + 20) << 24 | (y * 60 + 30) << 16 | (x * 90 + 50) << 8 | 0xff) >>> 0

const makeImage = () => {
  const image = new Jimp({ width: W, height: H, color: 0x000000ff })
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) image.setPixelColor(colour(x, y), x, y)
  return image
}

// out(x, y) in terms of the stored image `in`, per the EXIF spec, and the output size.
const EXPECTED: Record<number, { w: number; h: number; from: (x: number, y: number) => [number, number] }> = {
  1: { w: W, h: H, from: (x, y) => [x, y] },
  2: { w: W, h: H, from: (x, y) => [W - 1 - x, y] },
  3: { w: W, h: H, from: (x, y) => [W - 1 - x, H - 1 - y] },
  4: { w: W, h: H, from: (x, y) => [x, H - 1 - y] },
  5: { w: H, h: W, from: (x, y) => [y, x] },
  6: { w: H, h: W, from: (x, y) => [y, H - 1 - x] },
  7: { w: H, h: W, from: (x, y) => [W - 1 - y, H - 1 - x] },
  8: { w: H, h: W, from: (x, y) => [W - 1 - y, x] },
}

describe('applyExifOrientation', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8])('orientation %i produces the upright image', (orientation) => {
    const image = makeImage()
    applyExifOrientation(image, orientation)

    const { w, h, from } = EXPECTED[orientation]
    expect([image.bitmap.width, image.bitmap.height]).toEqual([w, h])
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const [sx, sy] = from(x, y)
        expect(image.getPixelColor(x, y)).toBe(colour(sx, sy))
      }
    }
  })

  it('ignores unknown orientation values', () => {
    const image = makeImage()
    applyExifOrientation(image, 99)
    expect([image.bitmap.width, image.bitmap.height]).toEqual([W, H])
    expect(image.getPixelColor(1, 2)).toBe(colour(1, 2))
  })
})

describe('isGifBuffer', () => {
  it('accepts GIF87a / GIF89a signatures only', () => {
    expect(isGifBuffer(Buffer.from('GIF89a....'))).toBe(true)
    expect(isGifBuffer(Buffer.from('GIF87a....'))).toBe(true)
    expect(isGifBuffer(Buffer.from('\x89PNG\r\n\x1a\n'))).toBe(false)
    expect(isGifBuffer(Buffer.from('<html>not an image</html>'))).toBe(false)
    expect(isGifBuffer(Buffer.alloc(0))).toBe(false)
  })
})
