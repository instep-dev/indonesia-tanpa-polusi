import EditArticleView from '@/components/dashboard/EditArticleView'

export const dynamic = 'force-dynamic'

const EditArticlePage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  return <EditArticleView articleId={id} />
}

export default EditArticlePage
