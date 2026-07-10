import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/layout';
import { Card, Badge, Select } from '../components/ui';
import { formatRelativeDate, cn } from '../utils';
import { supabase } from '../lib/supabase';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface LogEntry {
  id: string;
  type: 'api' | 'webhook' | 'scraper' | 'system';
  action: string;
  status: 'success' | 'error' | 'pending';
  details: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchLogs = useCallback(async () => {
    setLoading(true);

    const [eventsRes, ingestionRes] = await Promise.all([
      supabase
        .from('lead_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('ingestion_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    const entries: LogEntry[] = [];

    if (eventsRes.data) {
      for (const ev of eventsRes.data) {
        entries.push({
          id: ev.id,
          type: 'system',
          action: ev.event_type || 'event',
          status: 'success',
          details: JSON.stringify(ev.event_data || {}),
          timestamp: ev.created_at,
          metadata: ev.event_data as Record<string, unknown>,
        });
      }
    }

    if (ingestionRes.data) {
      for (const log of ingestionRes.data) {
        entries.push({
          id: log.id,
          type: 'scraper',
          action: log.connector || 'connector',
          status: log.errors ? 'error' : 'success',
          details: `Fetched: ${log.fetched || 0}, Created: ${log.created || 0}, Duplicates: ${log.duplicates || 0}, Hot: ${log.hot_count || 0}`,
          timestamp: log.created_at,
          metadata: { fetched: log.fetched, created: log.created, errors: log.errors },
        });
      }
    }

    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setLogs(entries);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    return log.type === filter;
  });

  return (
    <div>
      <Header
        title="Logs del Sistema"
        subtitle="Historial de eventos y operaciones"
      />

      <div className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Todos los tipos' },
              { value: 'api', label: 'API' },
              { value: 'webhook', label: 'Webhooks' },
              { value: 'scraper', label: 'Scrapers' },
              { value: 'system', label: 'Sistema' },
            ]}
            className="w-48"
          />
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>

        <Card>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay logs que mostrar
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-gray-50">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                    log.status === 'success' && 'bg-green-100',
                    log.status === 'error' && 'bg-red-100',
                    log.status === 'pending' && 'bg-yellow-100'
                  )}>
                    <StatusIcon status={log.status} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{log.action}</span>
                      <Badge variant={log.type === 'api' ? 'info' : log.type === 'webhook' ? 'purple' : log.type === 'scraper' ? 'warning' : 'default'} size="sm">
                        {log.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{log.details}</p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="mt-2 text-xs text-gray-400 font-mono">
                        {JSON.stringify(log.metadata)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {formatRelativeDate(log.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {!loading && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Mostrando {filteredLogs.length} entradas</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case 'error':
      return <XCircle className="w-5 h-5 text-red-600" />;
    case 'pending':
      return <Clock className="w-5 h-5 text-yellow-600" />;
    default:
      return <FileText className="w-5 h-5 text-gray-400" />;
  }
}
