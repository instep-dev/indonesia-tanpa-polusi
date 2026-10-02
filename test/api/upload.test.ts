import { NextRequest } from 'next/server'
import { POST } from '@/app/api/upload/route'
import { uploadImageToR2 } from '@/libs/r2'
import { orientation } from 'exifr'
import { prismaMock } from '../prisma-singleton'
import { makeAccessToken, makeSuperAdminAccessToken } from '../fixtures'

jest.mock('@/libs/r2', () => ({ uploadImageToR2: jest.fn().mockResolvedValue('https://media.example/uploaded.jpg') }))
jest.mock('exifr', () => ({ orientation: jest.fn().mockResolvedValue(undefined) }))

const mockImage = {
  bitmap: { width: 10, height: 10 },
  resize: jest.fn(),
  rotate: jest.fn(),
  flip: jest.fn(),
  getBuffer: jest.fn().mockResolvedValue(Buffer.from('jpeg')),
}
jest.mock('jimp', () => ({ Jimp: { read: jest.fn(() => Promise.resolve(mockImage)) } }))

const upload = (fields: { folder?: string; token?: string; file?: File }) => {
  const form = new FormData()
  form.append('file', fields.file ?? new File([Buffer.from('png')], 'a.png', { type: 'image/png' }))
  if (fields.folder !== undefined) form.append('folder', fields.folder)
  return POST(
    new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      headers: fields.token ? { authorization: `Bearer ${fields.token}` } : {},
      body: form,
    }),
  )
}

const asJournalist = () => {
  prismaMock.accessToken.findUnique.mockResolvedValue(makeAccessToken())
  prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(null)
}
const asSuperAdmin = () => {
  prismaMock.accessToken.findUnique.mockResolvedValue(null)
  prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
}

beforeEach(() => {
  jest.mocked(uploadImageToR2).mockClear()
  jest.mocked(orientation).mockResolvedValue(undefined)
  mockImage.rotate.mockClear()
  mockImage.flip.mockClear()
})

describe('POST /api/upload', () => {
  it('requires a token', async () => {
    prismaMock.accessToken.findUnique.mockResolvedValue(null)
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(null)
    expect((await upload({})).status).toBe(401)
  })

  it('keeps journalist uploads under articles/<userId> by default', async () => {
    asJournalist()
    const res = await upload({ token: 't' })
    expect(res.status).toBe(201)
    expect(uploadImageToR2).toHaveBeenCalledWith(expect.anything(), 'image/jpeg', 'articles/user_1')
  })

  it('does not let journalists write to the site folder', async () => {
    asJournalist()
    const res = await upload({ token: 't', folder: 'site' })
    expect(res.status).toBe(403)
    expect(uploadImageToR2).not.toHaveBeenCalled()
  })

  it('lets a super admin upload to site/<adminId>', async () => {
    asSuperAdmin()
    const res = await upload({ token: 't', folder: 'site' })
    expect(res.status).toBe(201)
    expect(uploadImageToR2).toHaveBeenCalledWith(expect.anything(), 'image/jpeg', 'site/admin_1')
  })

  it('rejects folders outside the whitelist (path traversal, unknown)', async () => {
    asSuperAdmin()
    for (const folder of ['../secrets', 'other', 'site/../articles']) {
      expect((await upload({ token: 't', folder })).status).toBe(400)
    }
    expect(uploadImageToR2).not.toHaveBeenCalled()
  })

  it('applies the EXIF orientation before re-encoding (portrait phone photo)', async () => {
    asJournalist()
    jest.mocked(orientation).mockResolvedValue(6)
    const res = await upload({ token: 't' })
    expect(res.status).toBe(201)
    expect(mockImage.rotate).toHaveBeenCalledWith(270) // Jimp rotates counter-clockwise
  })

  it('leaves upright photos alone', async () => {
    asJournalist()
    await upload({ token: 't' })
    expect(mockImage.rotate).not.toHaveBeenCalled()
    expect(mockImage.flip).not.toHaveBeenCalled()
  })

  it('rejects a file that claims to be a GIF but is not', async () => {
    asJournalist()
    const fake = new File([Buffer.from('<html>definitely not a gif</html>')], 'a.gif', { type: 'image/gif' })
    const res = await upload({ token: 't', file: fake })
    expect(res.status).toBe(400)
    expect(uploadImageToR2).not.toHaveBeenCalled()
  })

  it('accepts a real GIF and uploads it untouched', async () => {
    asJournalist()
    const gif = new File([Buffer.from('GIF89a\x01\x00\x01\x00')], 'a.gif', { type: 'image/gif' })
    const res = await upload({ token: 't', file: gif })
    expect(res.status).toBe(201)
    expect(uploadImageToR2).toHaveBeenCalledWith(expect.anything(), 'image/gif', 'articles/user_1')
  })
})
