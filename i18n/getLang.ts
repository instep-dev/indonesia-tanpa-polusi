import type { Locale } from "@/i18n/getDictionary";

export const getLang = (pathname: string, current: Locale, next: Locale): string =>
  pathname.replace(`/${current}`, `/${next}`);
