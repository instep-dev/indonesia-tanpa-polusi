import PageSpinner from '@/components/reusable/PageSpinner'

// Loading UI for the journalist dashboard only. There is deliberately NO root-level
// `app/loading.tsx`: a loading boundary makes the server commit to HTTP 200 before the page
// runs, so `notFound()` on the public pages could no longer answer 404 (it would answer
// 200 + noindex). Public marketing routes must not sit under a loading boundary.
const Loading = () => <PageSpinner />

export default Loading
