'use client'

import { toast } from 'vibe-toast'
import { UserCircle, CheckCircle } from '@phosphor-icons/react'
import { superAdminAuthStore } from '@/services/super-admin/super-admin-auth.store'
import { useJournalists, useApproveJournalist } from '@/services/user/user.queries'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const HEADER_CLASS = 'h-10 font-mono text-[10px] tracking-[0.06em] text-muted-foreground uppercase'

const JournalistsView = () => {
  const bootstrapped = superAdminAuthStore((s) => s.bootstrapped)
  const { data: journalists, isLoading } = useJournalists(bootstrapped)
  const approve = useApproveJournalist()

  if (!bootstrapped) return null

  const pendingCount = journalists?.filter((j) => !j.approvedAt).length ?? 0

  const handleApprove = (id: string, label: string) => {
    approve.mutate(id, {
      onSuccess: () => toast.success(`${label} approved`),
      onError: () => toast.error('Failed to approve account'),
    })
  }

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
          <Skeleton className="h-64 w-full rounded-xl" />
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
          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={HEADER_CLASS}>Name</TableHead>
                  <TableHead className={HEADER_CLASS}>Email</TableHead>
                  <TableHead className={HEADER_CLASS}>Registered</TableHead>
                  <TableHead className={`${HEADER_CLASS} text-right`}>Status</TableHead>
                  <TableHead className={`${HEADER_CLASS} text-right`}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journalists.map((journalist) => (
                  <TableRow key={journalist.id}>
                    <TableCell className="py-3 font-medium">{journalist.name || '—'}</TableCell>
                    <TableCell className="py-3 text-muted-foreground">{journalist.email}</TableCell>
                    <TableCell className="py-3 text-muted-foreground">
                      {new Date(journalist.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex justify-end">
                        {journalist.approvedAt ? (
                          <Badge className="bg-[#EDF3EC] font-mono text-[10px] tracking-[0.06em] text-[#346538] uppercase hover:bg-[#EDF3EC]">
                            Approved
                          </Badge>
                        ) : (
                          <Badge className="bg-[#FBF3DB] font-mono text-[10px] tracking-[0.06em] text-[#956400] uppercase hover:bg-[#FBF3DB]">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex justify-end">
                        {!journalist.approvedAt && (
                          <Button
                            size="sm"
                            disabled={approve.isPending}
                            onClick={() => handleApprove(journalist.id, journalist.name || journalist.email)}
                          >
                            <CheckCircle className="size-3.5" /> Approve
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}

export default JournalistsView
