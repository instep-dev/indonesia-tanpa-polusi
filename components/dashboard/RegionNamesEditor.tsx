'use client'

import { useState } from 'react'
import { toast } from 'vibe-toast'
import { useRegions, useUpdateRegion } from '@/services/region/region.queries'
import type { RegionDto } from '@/services/region/region.dto'
import { getApiErrorMessage } from '@/libs/getApiErrorMessage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

type RegionRowProps = { region: RegionDto }

const RegionRow = ({ region }: RegionRowProps) => {
  const update = useUpdateRegion()
  const [nameId, setNameId] = useState(region.nameId)
  const [nameEn, setNameEn] = useState(region.nameEn)
  const dirty = nameId.trim() !== region.nameId || nameEn.trim() !== region.nameEn

  const handleSave = () => {
    update.mutate(
      { id: region.id, body: { nameId, nameEn } },
      {
        onSuccess: () => toast.success(`${region.slug} renamed`),
        onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to rename the region')),
      },
    )
  }

  return (
    <div className="space-y-2.5 py-5 first:pt-0 last:pb-0">
      <p className="font-mono text-[11px] tracking-[0.06em] text-muted-foreground uppercase">/{region.slug}</p>
      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <div className="space-y-1.5">
          <Label htmlFor={`region-${region.id}-id`} className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
            Indonesian (ID)
          </Label>
          <Input id={`region-${region.id}-id`} className="h-9" value={nameId} onChange={(e) => setNameId(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`region-${region.id}-en`} className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
            English (EN)
          </Label>
          <Input id={`region-${region.id}-en`} className="h-9" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
        </div>
        <Button size="lg" disabled={!dirty || update.isPending} onClick={handleSave}>
          {update.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  )
}

// The one CMS editor that changes an existing database row (Region), so every
// change is an explicit per-row Save. The slug (URL / filter key) is read-only.
const RegionNamesEditor = () => {
  const { data: regions, isLoading } = useRegions()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Region names</CardTitle>
        <CardDescription>
          Shown on article cards and the article region filter. The page URL (shown above each pair) never changes.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y">
        {isLoading || !regions ? (
          <Skeleton className="h-24 w-full rounded-lg" />
        ) : (
          // Keyed by the saved names so a refetch after saving resets each row's local edits.
          regions.map((region) => <RegionRow key={`${region.id}:${region.nameId}:${region.nameEn}`} region={region} />)
        )}
      </CardContent>
    </Card>
  )
}

export default RegionNamesEditor
