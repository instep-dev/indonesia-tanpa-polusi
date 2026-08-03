import { db } from '@/libs/db'

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

export const generateUniqueArticleSlug = async (title: string): Promise<string> => {
  const base = slugify(title) || 'article'
  let slug = base
  let suffix = 1

  while (await db.article.findUnique({ where: { slug }, select: { id: true } })) {
    suffix += 1
    slug = `${base}-${suffix}`
  }

  return slug
}
