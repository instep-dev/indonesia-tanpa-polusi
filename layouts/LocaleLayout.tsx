import { getDictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/getDictionary";
import MarketingLayout from "@/layouts/MarketingLayout";

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
    <MarketingLayout
      locale={validLocale}
      navDict={dict.marketing.nav}
      contactDict={dict.marketing.home.contact}
    >
      {children}
    </MarketingLayout>
  );
}

export default LocaleLayout
