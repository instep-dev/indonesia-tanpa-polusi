'use client'

import Link from 'next/link'
import { Plus, FileText, Hourglass } from '@phosphor-icons/react'
import { authStore } from '@/services/auth/auth.store'
import { useMyArticles } from '@/services/article/article.queries'
import { useArticlesStream } from '@/services/article/article.sse'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import ArticleTable from '@/components/dashboard/ArticleTable'

const DashboardView = () => {
  const user = authStore((s) => s.user)
  const bootstrapped = authStore((s) => s.bootstrapped)
  const { data: articles, isLoading } = useMyArticles(bootstrapped)
  useArticlesStream(bootstrapped)

  if (!bootstrapped) return null

  const isApproved = !!user?.approvedAt

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8 sm:py-14">
      <div className="animate-in fade-in-0 slide-in-from-bottom-2 flex flex-col gap-6 duration-500 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">Workspace</p>
          <h1 className="mt-1.5 font-tilt-warp text-4xl tracking-tight text-foreground sm:text-[2.75rem]">
            My Articles
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Draft, submit, and track your coverage for the coalition.
          </p>
        </div>
        {isApproved && (
          <Button
            nativeButton={false}
            render={
              <Link href="/dashboard/articles/new">
                <Plus className="size-4" /> New Article
              </Link>
            }
          />
        )}
      </div>

      {!isApproved && (
        <Alert className="animate-in fade-in-0 slide-in-from-bottom-2 mt-6 border-[#F3E4B5] bg-[#FBF3DB] text-[#956400] duration-500 [&_svg]:text-[#956400]">
          <Hourglass size={16} />
          <AlertTitle>Your account is pending approval</AlertTitle>
          <AlertDescription className="text-[#956400]/80">
            A super admin needs to approve your account before you can write and submit articles.
          </AlertDescription>
        </Alert>
      )}

      <div className="animate-in fade-in-0 slide-in-from-bottom-2 mt-10 duration-700">
        <ArticleTable
          articles={articles ?? []}
          isLoading={isLoading}
          basePath="/dashboard/articles"
          emptyState={
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-[#F2F1EE]">
                  <FileText className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">No articles yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isApproved
                      ? 'Click "New Article" to write your first one.'
                      : 'Once your account is approved, you can write your first one.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          }
        />
      </div>
    </div>
  )
}

export default DashboardView
