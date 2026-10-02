import ContentPageView from '@/components/dashboard/ContentPageView'

// Auth-gated, admin-only content — never statically prerender.
export const dynamic = 'force-dynamic'

const ContentEditPage = async ({ params }: { params: Promise<{ page: string }> }) => {
  const { page } = await params
  return <ContentPageView slug={page} />
}

export default ContentEditPage
