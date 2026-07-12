// src/services/traffic/types.ts

export interface TrafficPayload {
  source: string;            // Identificador de la fuente (ej. 'meta_ads', 'shopify', 'whatsapp')
  external_id?: string;       // ID único que genera la plataforma externa
  name?: string;              // Nombre del cliente potencial
  phone?: string;             // Teléfono suministrado
  email?: string;             // Correo electrónico
  city?: string;              // Ciudad en Suiza (ej. Neuchâtel)
  canton?: string;            // Cantón (NE, VD, etc.)
  service?: string;           // Servicio solicitado (Débarras, Nettoyage, etc.)
  message?: string;           // Mensaje, comentarios o descripción del trabajo
  metadata?: Record<string, unknown>; // Datos técnicos adicionales de la plataforma de origen
}

export interface TrafficResult {
  success: boolean;
  leadId?: string;
  classification?: string;
  duplicate?: boolean;
  error?: string;
}

export interface SourceConfiguration {
  id: string;                 // ID único (ej. 'meta_lead_ads')
  name: string;               // Nombre visual (ej. 'Meta Lead Ads Official')
  isEnabled: boolean;         // Interruptor para encender/apagar la fuente
  defaultService?: string;    // Servicio por defecto si el cliente no lo especifica
  autoApprove: boolean;       // Si pasa directo al pipeline o requiere revisión
}
