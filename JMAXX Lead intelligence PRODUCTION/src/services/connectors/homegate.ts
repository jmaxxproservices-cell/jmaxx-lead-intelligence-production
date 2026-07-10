import { BaseConnector, ConnectorConfig, FetchResult, RawLeadData, NormalizedLead } from './base';

interface HomegateRawLead extends RawLeadData {
  id: string;
  title: string;
  description?: string;
  propertyType?: string;
  location?: string;
  canton?: string;
  price?: string;
  postedAt?: string;
  url: string;
  contactName?: string;
  contactPhone?: string;
}

interface HomegateConnectorConfig extends ConnectorConfig {
  propertyTypes?: ('apartment' | 'house' | 'renovation')[];
  regions?: string[];
}

export class HomegateConnector extends BaseConnector {
  declare protected config: HomegateConnectorConfig;

  constructor(config: HomegateConnectorConfig) {
    super(config);
  }

  async fetch(options?: { page?: number; limit?: number }): Promise<FetchResult> {
    return {
      success: true,
      leads: [],
      totalAvailable: 0,
      hasMore: false,
    };
  }

  normalize(rawLead: RawLeadData): NormalizedLead {
    const lead = rawLead as HomegateRawLead;

    return {
      external_id: `homegate-${lead.id}`,
      external_url: lead.url,
      source: 'homegate',
      title: lead.title,
      description: lead.description || null,
      city: lead.location || null,
      canton: lead.canton?.toUpperCase() || null,
      service_type: 'renovation',
      contact_name: lead.contactName || null,
      phone: this.normalizePhone(lead.contactPhone),
      email: null,
      priority: this.detectPriority(lead),
      price_mentioned: null,
      raw_data: {
        propertyType: lead.propertyType,
        postedAt: lead.postedAt,
      },
    };
  }

  private detectPriority(lead: HomegateRawLead): 'low' | 'medium' | 'high' | 'urgent' {
    const text = `${lead.title} ${lead.description || ''}`.toLowerCase();

    if (text.includes('urgent') || text.includes('schnell')) {
      return 'urgent';
    }

    return 'medium';
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Homegate connector configured (requires API access)' };
  }
}

export function createHomegateConnector(config: Partial<HomegateConnectorConfig>): HomegateConnector {
  return new HomegateConnector({
    id: config.id || 'homegate',
    name: config.name || 'Homegate',
    type: 'homegate',
    enabled: config.enabled ?? false,
    maxResults: config.maxResults || 50,
    ...config,
  });
}
