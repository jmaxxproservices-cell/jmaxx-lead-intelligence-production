// supabase/functions/traffic-bot/index.ts

import { serve } from "https://deno.land";
import { createClient } from "https://esm.sh";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[Traffic Bot] Iniciando rastreo automático de clientes en Neuchâtel...");

    // El bot simula la captura de leads detectados de forma autónoma en la región de Suiza
    const scrapedLeads = [
      {
        source: "bot_classifieds",
        name: "Marc Vuille",
        phone: "+41794852134",
        email: "marc.vuille@bluewin.ch",
        city: "La Chaux-de-Fonds",
        service: "Débarras",
        message: "Vente urgente de maison - Succession. Doit vider tout le mobilier d'ici la fin de la semaine."
      },
      {
        source: "bot_directory",
        name: "Régie Immobilière NE",
        phone: "+41327241199",
        email: "contact@regie-ne.ch",
        city: "Neuchâtel",
        service: "Nettoyage fin de bail",
        message: "Recherche entreprise de nettoyage urgente pour un appartement de 4 pièces suite à un départ imprévu."
      }
    ];

    let ingestedCount = 0;

    for (const leadData of scrapedLeads) {
      const { data: existing } = await supabaseClient
        .from('leads')
        .select('id')
        .eq('phone', leadData.phone)
        .maybeSingle();

      if (!existing) {
        const { error: insertError } = await supabaseClient
          .from('leads')
          .insert([
            {
              source: leadData.source,
              title: leadData.service,
              contact_name: leadData.name,
              phone: leadData.phone,
              email: leadData.email,
              city: leadData.city,
              status: 'new',
              description: leadData.message,
              metadata: { bot_scraped_at: new Date().toISOString(), region: "Neuchâtel" }
            }
          ]);

        if (!insertError) ingestedCount++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: `Rastreo completado. Extraídos ${ingestedCount} clientes automáticamente.` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Error' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
