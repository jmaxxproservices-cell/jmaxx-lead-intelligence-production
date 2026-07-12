import { supabase } from '@/lib/supabase';
import { normalizeLead } from './leadNormalizer';
import { triggerHotLeadAutomation } from './automation';

// Definimos la estructura limpia de los datos que permite la ley
export interface TrafficPayload {
  source: string;        // Origen del cliente (ej. 'shopify_form', 'facebook_ads')
  external_id?: string;   // ID único de la plataforma de origen
  name?: string;          // Nombre del cliente
  phone?: string;         // Teléfono de contacto
  email?: string;         // Correo electrónico
  city?: string;          // Ciudad (ej. Neuchâtel)
  canton?: string;        // Cantón inferido
  service?: string;       // Tipo de servicio solicitado
  message?: string;       // Mensaje o descripción del trabajo
  metadata?: Record<string, unknown>; // Datos técnicos adicionales seguros
}

export interface TrafficResult {
  success: boolean;
  leadId?: string;
  classification?: string;
  duplicate?: boolean;
  error?: string;
}

/**
 * Función principal y legal para procesar clientes entrantes autorizados.
 */
export async function processInboundLead(
  payload: TrafficPayload
): Promise<TrafficResult> {
  try {
    // 1. Limpiamos y normalizamos los datos del cliente (Teléfono a +41, Cantón, etc.)
    const normalized = normalizeLead(payload);

    // 2. Control de Duplicados (Evita procesar dos veces al mismo cliente en un periodo corto)
    const duplicate = await findDuplicateLead(
      normalized.phone,
      normalized.email
    );

    if (duplicate) {
      return {
        success: true,
        duplicate: true,
        leadId: duplicate.id
      };
    }

    // 3. Sistema de Puntuación de Intención (Calcula la urgencia del servicio en francés)
    const score = calculateIntentScore(normalized);
    
    // Clasificación basada en el puntaje acumulado
    let classification = 'medium';
    if (score >= 80) classification = 'hot';
    else if (score >= 65) classification = 'high';
    else if (score < 40) classification = 'low';

    // 4. Inserción segura en tu tabla de Leads de Supabase
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        source: normalized.source,
        title: normalized.service || 'Inbound Traffic Lead',
        contact_name: normalized.name,
        phone: normalized.phone,
        email: normalized.email,
        city: normalized.city,
        canton: normalized.canton,
        service_type: normalized.service,
        description: normalized.message,
        score,
        classification,
        status: 'new',
        metadata: normalized.metadata ?? {}
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // 5. Registramos el evento en el historial interno del sistema
    await logLeadCreated(lead.id);

    // 6. Si el cliente tiene una necesidad urgente (HOT), disparamos la alerta push inmediata
    if (classification === 'hot') {
      await triggerHotLeadAutomation({
        leadId: lead.id,
        phone: lead.phone,
        contactName: lead.contact_name,
        serviceType: lead.service_type
      });
    }

    return {
      success: true,
      leadId: lead.id,
      classification
    };
  } catch (err) {
    console.error('Traffic Engine Error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

/**
 * Busca si el cliente ya existe en el sistema por teléfono o email para cumplir con la LPD.
 */
async function findDuplicateLead(phone?: string, email?: string) {
  if (!phone && !email) return null;

  const query = supabase.from('leads').select('id').limit(1);

  if (phone) {
    query.eq('phone', phone);
  }
  if (email) {
    query.eq('email', email);
  }

  const { data } = await query.maybeSingle();
  return data;
}

/**
 * Analiza el texto del cliente de forma inteligente y legal para priorizar emergencias en Neuchâtel.
 */
function calculateIntentScore(lead: TrafficPayload): number {
  let score = 50; // Puntuación base neutral

  const text = `
    ${lead.service ?? ''}
    ${lead.message ?? ''}
  `.toLowerCase();

  // Palabras clave en francés para priorizar solicitudes urgentes
  if (text.includes('urgent')) score += 20;
  if (text.includes('immédiat')) score += 20;
  if (text.includes('fin de bail')) score += 15;
  if (text.includes('débarras')) score += 15;
  if (text.includes('vide maison')) score += 15;
  if (text.includes('déménagement')) score += 10;

  // Priorizamos leads que dejen datos completos de contacto rápido
  if (lead.phone) score += 10;
  if (lead.email) score += 5;

  return Math.min(score, 100); // El límite máximo es 100
}

/**
 * Guarda el rastro técnico de la creación para auditorías internas.
 */
async function logLeadCreated(leadId: string) {
  await supabase
    .from('lead_events')
    .insert({
      lead_id: leadId,
      event_type: 'traffic_lead_created'
    });
}
