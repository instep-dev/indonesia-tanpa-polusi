import PageSpinner from '@/components/reusable/PageSpinner'

// Loading UI for the super-admin area only — see the note in app/(protected)/loading.tsx
// for why there is no root-level loading.tsx.
const Loading = () => <PageSpinner />

export default Loading
