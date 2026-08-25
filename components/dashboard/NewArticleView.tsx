'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Hourglass } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import RegionSelect from '@/components/dashboard/RegionSelect'
import TiptapEditor from '@/components/dashboard/TiptapEditor'
import { authStore } from '@/services/auth/auth.store'
import { useCreateArticle } from '@/services/article/article.queries'
import type { SourceLocale } from '@/services/article/article.dto'

const NewArticleView = () => {
  const router = useRouter()
  const user = authStore((s) => s.user)
  const bootstrapped = authStore((s) => s.bootstrapped)
  const createArticle = useCreateArticle()

  const [sourceLocale, setSourceLocale] = useState<SourceLocale>('id')
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [regionId, setRegionId] = useState<string | null>(null)
  const [content, setContent] = useState<unknown>({})
  const [reportUrl, setReportUrl] = useState('')
  const [pressReleaseUrl, setPressReleaseUrl] = useState('')
  const [visualUrl, setVisualUrl] = useState('')

  const isApproved = !!user?.approvedAt

  if (bootstrapped && !isApproved) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8 sm:py-14">
        <Button
          nativeButton={false}
          variant="ghost"
          size="sm"
          className="-ml-2.5 mb-3"
          render={
            <Link href="/dashboard">
              <ArrowLeft className="size-3.5" /> Back
            </Link>
          }
        />
        <Alert className="border-[#F3E4B5] bg-[#FBF3DB] text-[#956400] [&_svg]:text-[#956400]">
          <Hourglass size={16} />
          <AlertTitle>Your account is pending approval</AlertTitle>
          <AlertDescription className="text-[#956400]/80">
            A super admin needs to approve your account before you can write articles.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const article = await createArticle.mutateAsync({
      sourceLocale,
      titleId: sourceLocale === 'id' ? title : undefined,
      titleEn: sourceLocale === 'en' ? title : undefined,
      excerptId: sourceLocale === 'id' ? excerpt : undefined,
      excerptEn: sourceLocale === 'en' ? excerpt : undefined,
      contentId: sourceLocale === 'id' ? content : undefined,
      contentEn: sourceLocale === 'en' ? content : undefined,
      regionId,
      reportUrl: reportUrl || null,
      pressReleaseUrl: pressReleaseUrl || null,
      visualUrl: visualUrl || null,
    })

    router.push(`/dashboard/articles/${article.id}`)
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8 sm:py-14">
      <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
        <Button
          nativeButton={false}
          variant="ghost"
          size="sm"
          className="-ml-2.5 mb-3"
          render={
            <Link href="/dashboard">
              <ArrowLeft className="size-3.5" /> Back
            </Link>
          }
        />
        <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">Compose</p>
        <h1 className="mt-1.5 font-tilt-warp text-4xl tracking-tight text-foreground">New Article</h1>
        <p className="mt-2 text-sm text-muted-foreground">Write a new article for the coalition.</p>
      </div>

      <Card className="animate-in fade-in-0 slide-in-from-bottom-2 mt-8 duration-700">
        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-7">
            <div className="space-y-2">
              <Label htmlFor="locale">Language</Label>
              <p className="text-xs text-muted-foreground">
                Write in one language — the other will be auto-translated when you submit for review.
              </p>
              <Select
                value={sourceLocale}
                onValueChange={(v) => setSourceLocale((v as SourceLocale) ?? 'id')}
              >
                <SelectTrigger id="locale" className="w-full sm:w-56">
                  <SelectValue>
                    {(v: string | null) => (v === 'en' ? 'English' : 'Bahasa Indonesia')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">Bahasa Indonesia</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                required
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Region</Label>
              <RegionSelect value={regionId} onChange={setRegionId} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="reportUrl">Report Link</Label>
                <Input
                  id="reportUrl"
                  value={reportUrl}
                  onChange={(e) => setReportUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pressReleaseUrl">Press Release Link</Label>
                <Input
                  id="pressReleaseUrl"
                  value={pressReleaseUrl}
                  onChange={(e) => setPressReleaseUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visualUrl">Visual Gallery Link</Label>
                <Input
                  id="visualUrl"
                  value={visualUrl}
                  onChange={(e) => setVisualUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <TiptapEditor content={content} onChange={setContent} />
            </div>
          </CardContent>

          <div className="flex justify-end border-t px-6 py-4">
            <Button type="submit" disabled={createArticle.isPending}>
              {createArticle.isPending ? 'Saving...' : 'Save Draft'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default NewArticleView
