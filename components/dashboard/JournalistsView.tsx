'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'vibe-toast'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { UserCircle, CheckCircle, MagnifyingGlass, CaretLeft, CaretRight, Eye, Prohibit } from '@phosphor-icons/react'
import { superAdminAuthStore } from '@/services/super-admin/super-admin-auth.store'
import { useJournalists, useApproveJournalist, useDeactivateJournalist } from '@/services/user/user.queries'
import { useAllArticlesAdmin } from '@/services/article/article.queries'
import ConfirmDialog from '@/components/dashboard/ConfirmDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { UserDto } from '@/services/auth/auth.dto'

const ALL_STATUSES = 'all'
const PENDING_STATUS = 'pending'
const APPROVED_STATUS = 'approved'
type SortOrder = 'newest' | 'oldest'

const PAGE_SIZE_OPTIONS = [10, 30, 50]

const JournalistsView = () => {
  const bootstrapped = superAdminAuthStore((s) => s.bootstrapped)
  const { data: journalists, isLoading } = useJournalists(bootstrapped)
  const approve = useApproveJournalist()
  const deactivate = useDeactivateJournalist()
  const { data: allArticles } = useAllArticlesAdmin(bootstrapped)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES)
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')

  const [viewingJournalist, setViewingJournalist] = useState<UserDto | null>(null)
  const [pendingDeactivate, setPendingDeactivate] = useState<UserDto | null>(null)

  const handleApprove = (id: string, label: string) => {
    approve.mutate(id, {
      onSuccess: () => toast.success(`${label} approved`),
      onError: () => toast.error('Failed to approve account'),
    })
  }

  const handleDeactivate = (id: string, label: string) => {
    deactivate.mutate(id, {
      onSuccess: () => {
        toast.success(`${label} deactivated`),
          setPendingDeactivate(null)
      },
      onError: () => toast.error('Failed to deactivate account'),
    })
  }

  const processedJournalists = useMemo(() => {
    const list = journalists ?? []
    const byStatus =
      statusFilter === ALL_STATUSES
        ? list
        : list.filter((journalist) =>
          statusFilter === PENDING_STATUS ? !journalist.approvedAt : !!journalist.approvedAt,
        )

    return [...byStatus].sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      return sortOrder === 'newest' ? diff : -diff
    })
  }, [journalists, statusFilter, sortOrder])

  const journalistArticles = useMemo(() => {
    if (!viewingJournalist || !allArticles) return []
    return allArticles.filter((a) => a.authorId === viewingJournalist.id)
  }, [viewingJournalist, allArticles])

  const columns = useMemo<ColumnDef<UserDto>[]>(
    () => [
      {
        id: 'name',
        accessorFn: (row) => row.name || row.email,
        header: 'Name',
        cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
      },
      {
        id: 'email',
        accessorKey: 'email',
        header: 'Email',
        cell: ({ getValue }) => <span className="text-muted-foreground">{getValue<string>()}</span>,
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: 'Registered',
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">
            {new Date(getValue<string>()).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: 'status',
        accessorFn: (row) => (row.approvedAt ? 'Approved' : 'Pending'),
        header: () => <div className="text-right">Status</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            {row.original.approvedAt ? (
              <Badge className="bg-[#EDF3EC] font-mono text-[10px] tracking-[0.06em] text-[#346538] uppercase hover:bg-[#EDF3EC]">
                Approved
              </Badge>
            ) : (
              <Badge className="bg-[#FBF3DB] font-mono text-[10px] tracking-[0.06em] text-[#956400] uppercase hover:bg-[#FBF3DB]">
                Pending
              </Badge>
            )}
          </div>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const user = row.original
          const isApproved = !!user.approvedAt

          return (
            <div className="flex justify-end gap-1.5">
              <Button
                variant="ghost"
                size="icon-sm"
                title="View details and articles"
                onClick={() => setViewingJournalist(user)}
              >
                <Eye className="size-4" />
              </Button>

              {isApproved ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Deactivate journalist"
                  disabled={deactivate.isPending}
                  className="text-[#9F2F2D] hover:bg-[#FDEBEC] hover:text-[#9F2F2D]"
                  onClick={() => setPendingDeactivate(user)}
                >
                  <Prohibit className="size-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Approve journalist"
                  disabled={approve.isPending}
                  className="text-[#346538] hover:bg-[#EDF3EC] hover:text-[#346538]"
                  onClick={() => handleApprove(user.id, user.name || user.email)}
                >
                  <CheckCircle className="size-4" />
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [approve.isPending, deactivate.isPending],
  )

  const table = useReactTable({
    data: processedJournalists,
    columns,
    state: { globalFilter: search },
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  // Jump back to page 1 whenever a filter narrows the result set — otherwise
  // the user can land on an out-of-range, seemingly "empty" page.
  useEffect(() => {
    table.setPageIndex(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, sortOrder, search])

  if (!bootstrapped) return null

  const pendingCount = journalists?.filter((j) => !j.approvedAt).length ?? 0

  const rows = table.getRowModel().rows
  const pageCount = table.getPageCount()
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const filteredCount = table.getFilteredRowModel().rows.length

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8 sm:py-14">
      <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
        <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">Access</p>
        <h1 className="mt-1.5 font-tilt-warp text-4xl tracking-tight text-foreground sm:text-[2.75rem]">
          Journalists
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {pendingCount > 0
            ? `${pendingCount} account${pendingCount > 1 ? 's' : ''} waiting for approval.`
            : 'Approve new accounts before they can write and submit articles.'}
        </p>
      </div>

      <div className="animate-in fade-in-0 slide-in-from-bottom-2 mt-10 duration-700">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-9 w-full max-w-xs" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : !journalists || journalists.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-[#F2F1EE]">
                <UserCircle className="size-5 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">No journalist accounts yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="animate-in fade-in-0 overflow-hidden rounded-xl border bg-card duration-500">
            <div className="flex flex-col gap-3 border-b bg-[#F2F1EE] p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-5">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative w-full sm:max-w-xs">
                  <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="h-9 bg-background pl-8"
                  />
                </div>

                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? ALL_STATUSES)}>
                  <SelectTrigger className="h-9 w-full bg-background text-xs sm:w-40">
                    <SelectValue placeholder="Status">
                      {(v: string | null) => {
                        if (v === ALL_STATUSES || v == null) return 'All statuses'
                        return v === PENDING_STATUS ? 'Pending' : 'Approved'
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
                    <SelectItem value={PENDING_STATUS}>Pending</SelectItem>
                    <SelectItem value={APPROVED_STATUS}>Approved</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortOrder} onValueChange={(v) => setSortOrder((v as SortOrder) ?? 'newest')}>
                  <SelectTrigger className="h-9 w-full bg-background text-xs sm:w-36">
                    <SelectValue>{(v: string | null) => (v === 'oldest' ? 'Oldest first' : 'Newest first')}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs tracking-[0.06em] text-muted-foreground uppercase">
                <span>Rows</span>
                <Select value={String(pageSize)} onValueChange={(v) => table.setPageSize(Number(v))}>
                  <SelectTrigger className="h-8 w-16 bg-background text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    <TableHead className="h-10 w-12 font-mono text-[10px] tracking-[0.06em] text-muted-foreground uppercase">
                      No
                    </TableHead>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="h-10 font-mono text-[10px] tracking-[0.06em] text-muted-foreground uppercase"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length + 1} className="h-24 text-center text-muted-foreground">
                      No results for &quot;{search}&quot;.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, i) => (
                    <TableRow key={row.id}>
                      <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                        {pageIndex * pageSize + i + 1}
                      </TableCell>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between gap-4 border-t px-4 py-3 font-mono text-xs text-muted-foreground sm:px-5">
              <span>
                {filteredCount === 0
                  ? '0 results'
                  : `Page ${pageIndex + 1} of ${Math.max(pageCount, 1)} · ${filteredCount} total`}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <CaretLeft className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <CaretRight className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!viewingJournalist} onOpenChange={(open) => !open && setViewingJournalist(null)}>
        <DialogContent
          className="w-full max-w-2xl"
          style={{ maxWidth: '672px', width: '90vw' }}
        >
          <DialogHeader>
            <DialogTitle className="font-tilt-warp text-2xl">Journalist Details</DialogTitle>
            <DialogDescription>
              Profile and published coverage in the newsroom.
            </DialogDescription>
          </DialogHeader>

          {viewingJournalist && (
            <div className="mt-4 space-y-6">
              {/* Journalist Profile Details */}
              <div className="grid grid-cols-2 gap-4 rounded-xl border bg-[#FBFBFA] p-4 text-sm min-w-0 overflow-hidden">
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="mt-0.5 font-medium">{viewingJournalist.name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="mt-0.5 font-mono text-xs break-all">{viewingJournalist.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Registered</p>
                  <p className="mt-0.5">{new Date(viewingJournalist.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="mt-1">
                    {viewingJournalist.approvedAt ? (
                      <Badge className="bg-[#EDF3EC] font-mono text-[9px] tracking-[0.06em] text-[#346538] uppercase hover:bg-[#EDF3EC]">
                        Approved
                      </Badge>
                    ) : (
                      <Badge className="bg-[#FBF3DB] font-mono text-[9px] tracking-[0.06em] text-[#956400] uppercase hover:bg-[#FBF3DB]">
                        Pending
                      </Badge>
                    )}
                  </p>
                </div>
              </div>

              {/* List of Articles */}
              <div className="space-y-3">
                <h3 className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
                  Articles Written ({journalistArticles.length})
                </h3>

                {journalistArticles.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No articles created yet.</p>
                ) : (
                  <div className="divide-y rounded-xl border overflow-y-auto max-h-[310px] w-full max-w-full overflow-x-hidden bg-background font-sans">
                    {journalistArticles.map((article) => {
                      const title = (article.sourceLocale === 'id' ? article.titleId : article.titleEn) || 'Untitled'
                      const date = new Date(article.publishedAt || article.createdAt).toLocaleDateString()

                      return (
                        <div key={article.id} className="flex items-center justify-between gap-4 p-3.5 text-sm hover:bg-muted/30">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground whitespace-normal break-words">{title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {article.sourceLocale.toUpperCase()} • Updated {date}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              article.status === 'PUBLISHED'
                                ? 'border-[#346538]/20 bg-[#EDF3EC] text-[#346538] hover:bg-[#EDF3EC]'
                                : article.status === 'PENDING_REVIEW'
                                  ? 'border-[#956400]/20 bg-[#FBF3DB] text-[#956400] hover:bg-[#FBF3DB]'
                                  : 'border-border bg-muted/50 text-muted-foreground hover:bg-muted/50'
                            }
                          >
                            {article.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!pendingDeactivate}
        onOpenChange={(open) => !open && setPendingDeactivate(null)}
        title="Deactivate Journalist?"
        description={`This will immediately revoke ${pendingDeactivate?.name || pendingDeactivate?.email}'s access. They will not be able to write or submit articles.`}
        confirmLabel="Deactivate"
        isPending={deactivate.isPending}
        onConfirm={() => {
          if (pendingDeactivate) {
            handleDeactivate(pendingDeactivate.id, pendingDeactivate.name || pendingDeactivate.email)
          }
        }}
      />
    </div>
  )
}

export default JournalistsView
