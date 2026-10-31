"use client";

import { createContext, useContext } from "react";

export type Language = "ar" | "fr";
export const LanguageContext = createContext<Language>("ar");

export function useLanguage() {
  const language = useContext(LanguageContext);
  return { language, t: (french: string, darija: string) => language === "ar" ? darija : french };
}

const messages: Record<string, string> = {
  "Client ajouté. Le carnet clients est à jour.": "تزاد الزبون وتحدّث دفتر الزبناء.",
  "Dites confirmer pour valider la réinitialisation, ou annuler pour garder le carnet.": "قول أكد باش ترجع الدفتر من الأول، أو إلغاء باش تخليه كيف هو.",
  "Aucune opération à confirmer.": "ما كايناش عملية باش تأكدها.",
  "Réinitialisation annulée.": "تلغات إعادة الدفتر من الأول.",
  "Brouillon annulé.": "تلغى الاقتراح.",
  "Action vocale annulée.": "تلغات العملية الصوتية.",
  "Parlez pour confirmer ou corriger la proposition.": "هضر باش تأكد أو تصحح الاقتراح.",
  "Langue changée.": "تبدلات اللغة.",
  "Mode exemples locaux activé.": "تفعّل وضع الأمثلة المحلية.",
  "Mode OpenAI activé.": "تفعّل وضع OpenAI.",
  "Page affichée.": "الصفحة واجدة.",
  "Exemple chargé. Vérifiez la phrase, puis lancez la compréhension.": "المثال واجد. راجع الجملة ومن بعد ضغط على فهم العملية.",
  "Proposition comprise par OpenAI. Vérifiez-la avant de confirmer.": "فهمنا العملية باستعمال OpenAI. راجعها قبل ما تأكد.",
  "Proposition issue du mode exemples locaux. Vérifiez-la avant de confirmer.": "هاد الاقتراح من الأمثلة المحلية. راجعو قبل ما تأكد.",
  "Je vous écoute… Appuyez à nouveau pour terminer (30 secondes maximum).": "كنسمع ليك… ضغط مرة أخرى باش تسالي (حتى لـ ٣٠ ثانية).",
  "Transcription en cours avec OpenAI…": "كنحولو الصوت لنص باستعمال OpenAI…",
  "Transcription prête. Corrigez le texte si nécessaire, puis lancez la compréhension.": "النص واجد. صححو إلا بغيتي ومن بعد ضغط على فهم العملية.",
  "Vente enregistrée. Votre carnet est à jour.": "تقيدات البيعة وتحدّث الدفتر.",
  "Remboursement enregistré. Le compte client est à jour.": "تقيد الخلاص وتحدّث حساب الزبون.",
  "Dernière opération annulée. Les montants et le stock ont été restaurés.": "ترجعات آخر عملية ورجع الحساب والستوك كيف كانو.",
  "Carnet réinitialisé. Les données de démonstration sont prêtes.": "رجع الدفتر من الأول والبيانات التجريبية واجدة.",
  "Mode exemples locaux : phrases prises en charge, sans appel OpenAI.": "وضع الأمثلة المحلية: جمل محددة بلا اتصال بـ OpenAI.",
  "Mode OpenAI : votre phrase sera envoyée pour interprétation.": "وضع OpenAI: غادي نرسلو الجملة باش نفهموها.",
  "Produit inconnu, quantité invalide ou stock insuffisant.": "المنتوج ما معروفش، العدد غير صالح أو الستوك ما كافيش.",
  "Choisissez un client du carnet.": "اختار زبون من الدفتر.",
  "Un achat à crédit nécessite un client.": "الشراء بالكريدي خاصو زبون.",
  "Le remboursement dépasse le crédit restant du client.": "الخلاص أكثر من الكريدي اللي باقي على الزبون.",
  "Ce client existe déjà ou son nom est invalide.": "هاد الزبون كاين ديجا أو السمية غير صالحة.",
  "Aucune opération à annuler.": "ما كايناش عملية باش ترجعها.",
  "Stockage local indisponible. Le carnet fonctionne pour cette session uniquement.": "التخزين المحلي ما خدامش. الدفتر غادي يخدم غير فهاد الجلسة.",
  "Ce carnet a changé dans un autre onglet. Rechargez la page pour retrouver la dernière version.": "الدفتر تبدل فصفحة أخرى. عاود حمل الصفحة باش تلقى آخر نسخة.",
};

export function localizedMessage(message: string, language: Language) {
  return language === "ar" ? messages[message] ?? message : message;
}
