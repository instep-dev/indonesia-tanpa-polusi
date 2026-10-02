import type { Prisma } from '@prisma/client'
import { db } from '@/libs/db'
import type { RevisionAction, RevisionKind } from '@/services/content-revision/content-revision.dto'

// Change history for CMS content. Every write route appends its revisions in the
// SAME transaction as the change (so history can never disagree with the data);
// `snapshot` is the state after the change, which is what "Restore" re-applies.

export const MAX_REVISIONS_PER_TARGET = 100

export type Actor = { id: string; name: string }

export type NewRevision = {
  kind: RevisionKind
  targetKey: string
  /** Set for items and collections, so a page's activity feed can find them. */
  collection?: string | null
  status?: 'PUBLISHED' | 'DRAFT'
  action: RevisionAction
  snapshot: Prisma.InputJsonValue
}

/** Display name stored with each revision (a snapshot, so it survives account changes). */
export const getActor = async (superAdminId: string): Promise<Actor> => {
  const admin = await db.superAdmin.findUnique({
    where: { id: superAdminId },
    select: { name: true, email: true },
  })
  return { id: superAdminId, name: admin?.name?.trim() || admin?.email || 'Super admin' }
}

/** Prisma operations that insert the revisions — pass them to the same `db.$transaction([...])` as the change. */
export const revisionOps = (actor: Actor, revisions: NewRevision[]) =>
  revisions.map((revision) =>
    db.contentRevision.create({
      data: {
        kind: revision.kind,
        targetKey: revision.targetKey,
        collection: revision.collection ?? null,
        status: revision.status ?? 'PUBLISHED',
        action: revision.action,
        snapshot: revision.snapshot,
        createdById: actor.id,
        createdByName: actor.name,
      },
    }),
  )

/** Keeps only the newest MAX_REVISIONS_PER_TARGET published revisions per target. Best effort: never fails a save. */
export const pruneRevisions = async (targets: Array<{ kind: RevisionKind; targetKey: string }>): Promise<void> => {
  try {
    for (const { kind, targetKey } of targets) {
      const stale =
        (await db.contentRevision.findMany({
          where: { kind, targetKey, status: 'PUBLISHED' },
          orderBy: { createdAt: 'desc' },
          skip: MAX_REVISIONS_PER_TARGET,
          select: { id: true },
        })) ?? []
      if (stale.length > 0) {
        await db.contentRevision.deleteMany({ where: { id: { in: stale.map((row) => row.id) } } })
      }
    }
  } catch (error) {
    console.error('Could not prune old content revisions:', error)
  }
}
