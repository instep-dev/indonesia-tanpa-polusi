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
import { UserCircle, CheckCircle, MagnifyingGlass, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { superAdminAuthStore } from '@/services/super-admin/super-admin-auth.store'
import { useJournalists, useApproveJournalist } from '@/services/user/user.queries'
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

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES)
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')

  const handleApprove = (id: string, label: string) => {
    approve.mutate(id, {
      onSuccess: () => toast.success(`${label} approved`),
      onError: () => toast.error('Failed to approve account'),
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
        cell: ({ row }) => (
          <div className="flex justify-end">
            {!row.original.approvedAt && (
              <Button
                size="sm"
                disabled={approve.isPending}
                onClick={() => handleApprove(row.original.id, row.original.name || row.original.email)}
              >
                <CheckCircle className="size-3.5" /> Approve
              </Button>
            )}
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [approve.isPending],
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
        <h1 className="mt-1.5 font-editorial text-4xl tracking-tight text-foreground sm:text-[2.75rem]">
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
    </div>
  )
}

export default JournalistsView
