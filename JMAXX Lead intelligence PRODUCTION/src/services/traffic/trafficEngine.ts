import { supabase } from '@/lib/supabase';
import { normalizeLead } from './leadNormalizer';
import { triggerHotLeadAutomation } from './automation';
import { validateAndGetSource } from './sourceRegistry';
import { TrafficPayload, TrafficResult } from './types';

/**
 * Función central del negocio: Procesa clientes de múltiples fuentes autorizadas.
 */
export async function processInboundLead(
  payload: TrafficPayload
): Promise<TrafficResult> {
  try {
    // 1. Validamos si la fuente externa está registrada y activa en el sistema
    const sourceConfig = validateAndGetSource(payload.source);
    if (!sourceConfig) {
      return {
        success: false,
        error: `La fuente de tráfico '${payload.source}' no está autorizada o está desactivada.`
      };
    }

    // 2. Si el payload no trae servicio, le asignamos el servicio por defecto configurado para esa fuente
    if (!payload.service && sourceConfig.defaultService) {
      payload.service = sourceConfig.defaultService;
    }

    // 3. Limpiamos los datos del cliente (Teléfonos suizos a +41, inferencia de Cantón, etc.)
    const normalized = normalizeLead(payload);

    // 4. Control de duplicados en la base de datos para cumplir con normativas de datos
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

    // 5. Calculamos el nivel de urgencia de la solicitud en francés
    const score = calculateIntentScore(normalized);
    
    // Clasificación inteligente del cliente potencial
    let classification = 'medium';
    if (score >= 80) classification = 'hot';
    else if (score >= 65) classification = 'high';
    else if (score < 40) classification = 'low';

    // 6. Inserción en la base de datos de Supabase asignando el estado inicial
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
        status: sourceConfig.autoApprove ? 'new' : 'qualification', // Si no auto-aprueba, va a calificación manual
        metadata: {
          ...(normalized.metadata ?? {}),
          source_display_name: sourceConfig.name
        }
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // 7. Guardamos el rastro del evento para control del negocio
    await logLeadCreated(lead.id);

    // 8. Alerta inmediata en tu teléfono o canal asignado para clientes HOT
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

function calculateIntentScore(lead: TrafficPayload): number {
  let score = 50;

  const text = `
    ${lead.service ?? ''}
    ${lead.message ?? ''}
  `.toLowerCase();

  if (text.includes('urgent')) score += 20;
  if (text.includes('immédiat')) score += 20;
  if (text.includes('fin de bail')) score += 15;
  if (text.includes('débarras')) score += 15;
  if (text.includes('vide maison')) score += 15;
  if (text.includes('déménagement')) score += 10;

  if (lead.phone) score += 10;
  if (lead.email) score += 5;

  return Math.min(score, 100);
}

async function logLeadCreated(leadId: string) {
  await supabase
    .from('lead_events')
    .insert({
      lead_id: leadId,
      event_type: 'traffic_lead_created'
    });
}
