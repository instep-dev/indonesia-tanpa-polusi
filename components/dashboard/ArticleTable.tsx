'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { MagnifyingGlass, CaretLeft, CaretRight, Trash, Eye } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/libs/utils'
import ArticleStatusBadge from '@/components/dashboard/ArticleStatusBadge'
import { useRegions } from '@/services/region/region.queries'
import type { ArticleDto } from '@/services/article/article.dto'

const NO_REGION = 'none'
const ALL_REGIONS = 'all'
type SortOrder = 'newest' | 'oldest'

type ArticleTableProps = {
  articles: ArticleDto[]
  isLoading: boolean
  basePath: string
  emptyState: React.ReactNode
  dateLabel?: string
  onDelete?: (article: ArticleDto) => void
  deletingId?: string | null
  onPreview?: (article: ArticleDto) => void
}

const PAGE_SIZE_OPTIONS = [10, 30, 50]

const ArticleTable = ({
  articles,
  isLoading,
  basePath,
  emptyState,
  dateLabel = 'Updated',
  onDelete,
  deletingId,
  onPreview,
}: ArticleTableProps) => {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState<string>(ALL_REGIONS)
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const { data: regions } = useRegions()

  const processedArticles = useMemo(() => {
    const filtered =
      regionFilter === ALL_REGIONS
        ? articles
        : articles.filter((article) =>
            regionFilter === NO_REGION ? !article.regionId : article.regionId === regionFilter,
          )

    return [...filtered].sort((a, b) => {
      const diff = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      return sortOrder === 'newest' ? diff : -diff
    })
  }, [articles, regionFilter, sortOrder])

  const columns = useMemo<ColumnDef<ArticleDto>[]>(
    () => [
      {
        id: 'title',
        accessorFn: (row) => (row.sourceLocale === 'id' ? row.titleId : row.titleEn) || '(untitled)',
        header: 'Title',
        cell: ({ getValue, row }) => (
          <span
            className={cn('font-medium', row.original.deletedAt && 'text-muted-foreground line-through')}
          >
            {getValue<string>()}
          </span>
        ),
      },
      {
        id: 'region',
        accessorFn: (row) => row.region?.nameEn ?? 'General',
        header: 'Region',
        cell: ({ getValue }) => <span className="text-muted-foreground">{getValue<string>()}</span>,
      },
      {
        id: 'updatedAt',
        accessorKey: 'updatedAt',
        header: dateLabel,
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">
            {new Date(getValue<string>()).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: () => <div className="text-right">Status</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <ArticleStatusBadge status={row.original.status} deletedAt={row.original.deletedAt} />
          </div>
        ),
      },
      ...(onDelete || onPreview
        ? [
            {
              id: 'actions',
              header: () => <div className="text-right">Actions</div>,
              cell: ({ row }) => (
                <div className="flex justify-end gap-1">
                  {onPreview && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Preview article"
                      onClick={(e) => {
                        e.stopPropagation()
                        onPreview(row.original)
                      }}
                    >
                      <Eye className="size-3.5" />
                    </Button>
                  )}
                  {onDelete && !row.original.deletedAt && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-[#9F2F2D] hover:bg-[#FDEBEC] hover:text-[#9F2F2D]"
                      disabled={deletingId === row.original.id}
                      aria-label="Delete article"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(row.original)
                      }}
                    >
                      <Trash className="size-3.5" />
                    </Button>
                  )}
                </div>
              ),
            } satisfies ColumnDef<ArticleDto>,
          ]
        : []),
    ],
    [dateLabel, onDelete, deletingId, onPreview],
  )

  const table = useReactTable({
    data: processedArticles,
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
  }, [regionFilter, sortOrder, search])

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-full max-w-xs" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (articles.length === 0) {
    return <>{emptyState}</>
  }

  const rows = table.getRowModel().rows
  const pageCount = table.getPageCount()
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const filteredCount = table.getFilteredRowModel().rows.length

  return (
    <div className="animate-in fade-in-0 overflow-hidden rounded-xl border bg-card duration-500">
      <div className="flex flex-col gap-3 border-b bg-[#F2F1EE] p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-5">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title..."
              className="h-9 bg-background pl-8"
            />
          </div>

          <Select value={regionFilter} onValueChange={(v) => setRegionFilter(v ?? ALL_REGIONS)}>
            <SelectTrigger className="h-9 w-full bg-background text-xs sm:w-40">
              <SelectValue placeholder="Region">
                {(v: string | null) => {
                  if (v === ALL_REGIONS || v == null) return 'All regions'
                  if (v === NO_REGION) return 'General (no region)'
                  return regions?.find((region) => region.id === v)?.nameEn ?? v
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_REGIONS}>All regions</SelectItem>
              <SelectItem value={NO_REGION}>General (no region)</SelectItem>
              {regions?.map((region) => (
                <SelectItem key={region.id} value={region.id}>
                  {region.nameEn}
                </SelectItem>
              ))}
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
          <Select
            value={String(pageSize)}
            onValueChange={(v) => table.setPageSize(Number(v))}
          >
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
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() => router.push(`${basePath}/${row.original.id}`)}
              >
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
  )
}

export default ArticleTable
