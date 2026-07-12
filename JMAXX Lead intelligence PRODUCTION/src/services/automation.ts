// src/services/traffic/automation.ts

import { supabase } from "@/lib/supabase";

export interface HotLeadAutomationInput {
  leadId: string;
  phone?: string;
  contactName?: string;
  serviceType?: string;
}

export async function triggerHotLeadAutomation(
  input: HotLeadAutomationInput
): Promise<void> {
  const webhook = import.meta.env.VITE_HOT_LEAD_WEBHOOK_URL;

  const payload = {
    event: "hot_lead",
    timestamp: new Date().toISOString(),
    lead: {
      id: input.leadId,
      contactName: input.contactName ?? "",
      phone: input.phone ?? "",
      serviceType: input.serviceType ?? ""
    }
  };

  try {
    if (webhook) {
      const response = await fetch(webhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`);
      }
    }

    await supabase.from("lead_events").insert({
      lead_id: input.leadId,
      event_type: "hot_lead_notification_sent",
      metadata: payload
    });
  } catch (error) {
    console.error("Hot lead automation failed:", error);

    await supabase.from("lead_events").insert({
      lead_id: input.leadId,
      event_type: "hot_lead_notification_failed",
      metadata: {
        message:
          error instanceof Error ? error.message : "Unknown error"
      }
    });
  }
}
