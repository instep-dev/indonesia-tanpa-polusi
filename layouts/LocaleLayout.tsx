import { getDictionary, type Locale } from "@/i18n/getDictionary";
import MarketingLayout from "@/layouts/MarketingLayout";
import LangToggle from "@/components/reusable/LangToggle";

const LocaleLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) => {
  const { locale } = await params;
  const validLocale: Locale = locale === "en" ? "en" : "id";
  const dict = await getDictionary(validLocale);

  return (
    <MarketingLayout>
      <LangToggle currentLocale={validLocale} />
      {children}
    </MarketingLayout>
  );
}

export default LocaleLayout
