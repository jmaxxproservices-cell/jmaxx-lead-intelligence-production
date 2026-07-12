// src/services/traffic/leadNormalizer.ts

import type { TrafficPayload } from './trafficEngine';

export interface NormalizedLead extends TrafficPayload {
  phone?: string;
  city?: string;
  canton?: string;
  service?: string;
  metadata?: Record<string, unknown>;
}

const CITY_TO_CANTON: Record<string, string> = {
  neuchatel: "NE",
  neuchâtel: "NE",
  lachauxdefonds: "NE",
  "la chaux de fonds": "NE",
  "la chaux-de-fonds": "NE",
  lelocle: "NE",
  "le locle": "NE",
  boudry: "NE",
  corcelles: "NE",
  corcellescormondreche: "NE",
  cormondreche: "NE",
  peseux: "NE",
  auvernier: "NE",
  colombier: "NE",
  cressier: "NE",
  saintblaise: "NE",
  "saint-blaise": "NE",
  marin: "NE",
  marin_epagnier: "NE",
  valangin: "NE"
};

const SERVICE_PATTERNS = [
  {
    service: "Nettoyage fin de bail",
    patterns: [
      "fin de bail",
      "état des lieux",
      "etat des lieux",
      "sortie appartement",
      "nettoyage fin"
    ]
  },
  {
    service: "Débarras",
    patterns: [
      "débarras",
      "debarras",
      "vide maison",
      "vide-maison",
      "vider maison",
      "vider appartement",
      "vide cave",
      "succession"
    ]
  },
  {
    service: "Déménagement",
    patterns: [
      "déménagement",
      "demenagement",
      "moving",
      "transport meubles",
      "transport mobilier"
    ]
  },
  {
    service: "Nettoyage",
    patterns: [
      "nettoyage",
      "ménage",
      "menage",
      "vitres",
      "grand nettoyage",
      "deep cleaning"
    ]
  }
];

export function normalizeLead(payload: TrafficPayload): NormalizedLead {

  const phone = normalizeSwissPhone(payload.phone);

  const city = normalizeCity(payload.city);

  const canton =
    payload.canton ??
    inferCanton(city);

  const service =
    payload.service ??
    detectService(payload.message ?? "");

  return {
    ...payload,
    phone,
    city,
    canton,
    service,
    metadata: {
      ...(payload.metadata ?? {}),
      normalized_at: new Date().toISOString()
    }
  };
}

export function normalizeSwissPhone(
  input?: string
): string | undefined {

  if (!input) return undefined;

  let phone = input
    .replace(/[^\d+]/g, "");

  if (phone.startsWith("0041")) {
    phone = "+41" + phone.substring(4);
  }

  if (phone.startsWith("41") && !phone.startsWith("+41")) {
    phone = "+" + phone;
  }

  if (phone.startsWith("0")) {
    phone = "+41" + phone.substring(1);
  }

  if (
    phone.length === 9 &&
    phone.startsWith("7")
  ) {
    phone = "+41" + phone;
  }

  if (
    !phone.startsWith("+41")
  ) {
    return undefined;
  }

  return phone;
}

export function normalizeCity(
  city?: string
): string | undefined {

  if (!city) return undefined;

  return city
    .trim()
    .replace(/\s+/g, " ");
}

export function inferCanton(
  city?: string
): string | undefined {

  if (!city) return undefined;

  const key = city
    .toLowerCase()
    .replace(/-/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");

  return CITY_TO_CANTON[key];
}

export function detectService(
  text: string
): string | undefined {

  const value = text.toLowerCase();

  for (const item of SERVICE_PATTERNS) {

    const found = item.patterns.some(pattern =>
      value.includes(pattern)
    );

    if (found) {
      return item.service;
    }
  }

  return undefined;
}

export function isLocalIntent(
  lead: NormalizedLead
): boolean {

  if (
    lead.canton === "NE"
  ) {
    return true;
  }

  const city =
    (lead.city ?? "").toLowerCase();

  return (
    city.includes("neuch") ||
    city.includes("chaux") ||
    city.includes("locle") ||
    city.includes("peseux")
  );
}
