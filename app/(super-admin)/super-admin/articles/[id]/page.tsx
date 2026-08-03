import ArticleReviewView from '@/components/dashboard/ArticleReviewView'

export const dynamic = 'force-dynamic'

const ArticleReviewPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  return <ArticleReviewView articleId={id} />
}

export default ArticleReviewPage
