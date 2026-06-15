import type en from "@/messages/en.json";

export type Locale = "en" | "id";
export type Dictionary = typeof en;

const dictionaries = {
  en: () => import("@/messages/en.json").then((m) => m.default),
  id: () => import("@/messages/id.json").then((m) => m.default),
};

export const getDictionary = async (locale: Locale): Promise<Dictionary> =>
  dictionaries[locale]();
