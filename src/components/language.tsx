"use client";

import { createContext, useContext } from "react";

export type Language = "ar" | "fr";
export const LanguageContext = createContext<Language>("ar");

export function useLanguage() {
  const language = useContext(LanguageContext);
  return { language, t: (french: string, darija: string) => language === "ar" ? darija : french };
}
