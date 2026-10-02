import type { Locale } from "@/i18n/getDictionary";
import MarketingLayout from "@/layouts/MarketingLayout";
import { buildCollage, buildNavLogos } from "@/libs/contentMerge";
import { getSiteDictionary, getSiteValues, getSocials, isPreviewMode } from "@/libs/siteContent";
import PreviewBanner from "@/components/marketing/PreviewBanner";

const LocaleLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) => {
  const { locale } = await params;
  const validLocale: Locale = locale === "en" ? "en" : "id";
  const [dict, values, socials, previewing] = await Promise.all([
    getSiteDictionary(validLocale),
    getSiteValues(validLocale),
    getSocials(),
    isPreviewMode(),
  ]);

  return (
    <>
    <MarketingLayout
      locale={validLocale}
      navDict={dict.marketing.nav}
      contactDict={dict.marketing.home.contact}
      logos={buildNavLogos(values)}
      contact={{
        email: values["site.contact.email"],
        socials,
        collage: buildCollage(values),
      }}
    >
      {children}
    </MarketingLayout>
    {previewing && <PreviewBanner />}
    </>
  );
}

export default LocaleLayout
