import { Badge } from '@/components/ui/badge'
import { cn } from '@/libs/utils'
import type { ArticleStatus } from '@/services/article/article.dto'

const STYLES: Record<ArticleStatus, string> = {
  DRAFT: 'bg-[#F2F1EE] text-[#787774] hover:bg-[#F2F1EE]',
  PENDING_REVIEW: 'bg-[#FBF3DB] text-[#956400] hover:bg-[#FBF3DB]',
  PUBLISHED: 'bg-[#EDF3EC] text-[#346538] hover:bg-[#EDF3EC]',
  REJECTED: 'bg-[#FDEBEC] text-[#9F2F2D] hover:bg-[#FDEBEC]',
}

const LABELS: Record<ArticleStatus, string> = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Pending Review',
  PUBLISHED: 'Published',
  REJECTED: 'Rejected',
}

const DELETED_STYLE = 'bg-[#FDEBEC] text-[#9F2F2D] hover:bg-[#FDEBEC]'

type ArticleStatusBadgeProps = {
  status: ArticleStatus
  deletedAt?: string | null
}

const ArticleStatusBadge = ({ status, deletedAt }: ArticleStatusBadgeProps) => (
  <Badge
    className={cn(
      'font-mono text-[10px] tracking-[0.06em] uppercase',
      deletedAt ? DELETED_STYLE : STYLES[status],
    )}
  >
    {deletedAt ? 'Deleted' : LABELS[status]}
  </Badge>
)

export default ArticleStatusBadge
