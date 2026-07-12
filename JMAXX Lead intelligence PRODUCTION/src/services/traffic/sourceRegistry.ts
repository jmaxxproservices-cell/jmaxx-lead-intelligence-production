// src/services/traffic/sourceRegistry.ts

import { SourceConfiguration } from './types';

// Listado maestro y legal de tus fuentes oficiales de tráfico
const REGISTERED_SOURCES: Record<string, SourceConfiguration> = {
  shopify_form: {
    id: 'shopify_form',
    name: 'Shopify Website Contact',
    isEnabled: true,
    defaultService: 'Nettoyage Professionnel',
    autoApprove: true
  },
  meta_lead_ads: {
    id: 'meta_lead_ads',
    name: 'Facebook & Instagram Lead Ads',
    isEnabled: true,
    defaultService: 'Débarras / Vide-Maison',
    autoApprove: true
  },
  whatsapp_business: {
    id: 'whatsapp_business',
    name: 'WhatsApp Business Inbound',
    isEnabled: true,
    defaultService: 'Nettoyage fin de bail',
    autoApprove: true
  },
  google_business: {
    id: 'google_business',
    name: 'Google My Business Messages',
    isEnabled: true,
    autoApprove: false // Los de Google los dejamos en revisión manual por seguridad
  },
  partner_portal: {
    id: 'partner_portal',
    name: 'Portal de Partners de Suiza',
    isEnabled: true,
    autoApprove: true
  }
};

/**
 * Valida de forma segura si la plataforma que intenta enviarte un cliente está registrada y activa.
 */
export function validateAndGetSource(sourceId: string): SourceConfiguration | null {
  const source = REGISTERED_SOURCES[sourceId.toLowerCase()];
  
  if (!source) {
    console.warn(`[Traffic Engine] Intento de conexión no autorizado desde la fuente: ${sourceId}`);
    return null;
  }

  if (!source.isEnabled) {
    console.warn(`[Traffic Engine] La fuente ${source.name} está temporalmente desactivada.`);
    return null;
  }

  return source;
}

/**
 * Devuelve la lista completa de tus canales activos para auditorías o analíticas.
 */
export function getActiveSources(): SourceConfiguration[] {
  return Object.values(REGISTERED_SOURCES).filter(src => src.isEnabled);
}
