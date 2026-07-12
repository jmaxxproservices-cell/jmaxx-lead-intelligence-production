// src/supabase/functions/traffic-webhook/index.ts

import { serve } from "https://deno.land";
import { createClient } from "https://esm.sh";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: "Method Not Allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const incomingToken = req.headers.get("x-webhook-secret");
    const serverSecret = Deno.env.get("WEBHOOK_SECRET");

    if (!incomingToken || incomingToken !== serverSecret) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized: Invalid webhook secret token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON format payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sourceId = payload.source || 'webhook_traffic';
    const rawLeadData = {
      source: sourceId.toLowerCase(),
      external_id: payload.id || payload.lead_id || payload.external_id || null,
      name: payload.name || payload.contact_name || payload.full_name || 'Cliente Inbound',
      phone: payload.phone || payload.telephone || payload.contact_phone || null,
      email: payload.email || payload.contact_email || null,
      city: payload.city || payload.localite || 'Neuchâtel',
      canton: payload.canton || null,
      service: payload.service || payload.service_type || null,
      message: payload.message || payload.description || payload.comment || '',
    };

    if (!rawLeadData.phone && !rawLeadData.email) {
      return new Response(
        JSON.stringify({ success: false, error: "Bad Request: Phone number or email is strictly required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (rawLeadData.phone) {
      const { data: existingPhone } = await supabaseClient
        .from('leads')
        .select('id')
        .eq('phone', rawLeadData.phone)
        .limit(1)
        .maybeSingle();
        
      if (existingPhone) {
        return new Response(
          JSON.stringify({ success: true, status: "duplicate", message: "Lead already processed in the system", leadId: existingPhone.id }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const clientIp = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const { data: lead, error: insertError } = await supabaseClient
      .from('leads')
      .insert([
        {
          source: rawLeadData.source,
          title: rawLeadData.service || 'Inbound Traffic Lead',
          contact_name: rawLeadData.name,
          phone: rawLeadData.phone,
          email: rawLeadData.email,
          city: rawLeadData.city,
          canton: rawLeadData.canton,
          service_type: rawLeadData.service,
          description: rawLeadData.message,
          status: 'new',
          metadata: {
            raw_payload: payload,
            received_at: new Date().toISOString(),
            request_ip: clientIp,
            user_agent: userAgent
          }
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    await supabaseClient
      .from('lead_events')
      .insert([
        {
          lead_id: lead.id,
          event_type: 'traffic_webhook_ingestion_success',
          metadata: { source: rawLeadData.source, ip: clientIp }
        }
      ]);

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: "created", 
        leadId: lead.id,
        classification: "pending_scoring" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201 }
    )

  } catch (error) {
    console.error('Webhook Ingestion Critical Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Internal Server Error: Database operation failed securely." 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    )
  }
});
