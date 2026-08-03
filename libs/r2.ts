import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import crypto from 'crypto'

const accountId = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
const bucketName = process.env.R2_BUCKET_NAME
const publicUrl = process.env.R2_PUBLIC_URL

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined,
  credentials:
    accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
})

const extensionFromType = (contentType: string): string => {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  }
  return map[contentType] ?? 'bin'
}

export const uploadImageToR2 = async (
  buffer: Buffer,
  contentType: string,
  folder: string,
): Promise<string> => {
  if (!bucketName || !publicUrl) {
    throw new Error('R2_BUCKET_NAME or R2_PUBLIC_URL is not configured')
  }

  const key = `${folder}/${crypto.randomUUID()}.${extensionFromType(contentType)}`

  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  )

  return `${publicUrl}/${key}`
}

export const deleteImageFromR2 = async (url: string): Promise<void> => {
  if (!bucketName || !publicUrl) {
    throw new Error('R2_BUCKET_NAME or R2_PUBLIC_URL is not configured')
  }
  if (!url.startsWith(publicUrl)) return

  const key = url.slice(publicUrl.length + 1)

  await r2Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }))
}
