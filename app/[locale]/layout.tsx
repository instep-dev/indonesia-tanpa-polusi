import LocaleLayout from "@/layouts/LocaleLayout";

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
