import LocaleLayout from "@/layouts/LocaleLayout";

// Public copy/media is CMS-managed (read from the DB per request), so these
// pages must not be served from the build-time Full Route Cache — otherwise
// edits made in the super-admin would never show up.
export const dynamic = 'force-dynamic'

const layout = ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) => {
  return (
    <LocaleLayout params={params}>
      {children}
    </LocaleLayout>
  )
}

export default layout
