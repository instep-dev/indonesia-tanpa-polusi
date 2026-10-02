import EditArticleView from '@/components/dashboard/EditArticleView'

export const dynamic = 'force-dynamic'

// Super-admin "fix mode": edit both languages of any article (not creating new ones).
const EditArticleAsAdminPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  return <EditArticleView articleId={id} actor="super-admin" />
}

export default EditArticleAsAdminPage
