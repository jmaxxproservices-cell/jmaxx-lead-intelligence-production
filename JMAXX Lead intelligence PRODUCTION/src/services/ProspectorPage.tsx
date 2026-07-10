import { useState } from 'react';
import { Search, MapPin, Plus, CheckCircle, Building2, Phone, Globe, Star } from 'lucide-react';
import { searchPlaces, getPlaceDetails, PlaceResult } from '../services/placesService';
import { searchZefix, ZefixCompany } from '../services/zefixService';
import { useLeads } from '../hooks/useLeads';
import { generateLeadId } from '../utils';

type ProspectSource = 'google' | 'zefix';

interface Prospect {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  source: ProspectSource;
  added?: boolean;
}

export function ProspectorPage() {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('Neuchâtel');
  const [source, setSource] = useState<ProspectSource>('google');
  const [results, setResults] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createLead } = useLeads();

  async function handleSearch() {
    if (!keyword.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      if (source === 'google') {
        const places = await searchPlaces(keyword, location);
        const prospects: Prospect[] = places.map((p: PlaceResult) => ({
          id: p.place_id,
          name: p.name,
          address: p.formatted_address,
          phone: p.formatted_phone_number,
          website: p.website,
          rating: p.rating,
          source: 'google',
          added: false,
        }));
        setResults(prospects);
      } else {
        const companies = await searchZefix(`${keyword} ${location}`);
        const prospects: Prospect[] = companies.map((c: ZefixCompany) => ({
          id: c.uid,
          name: c.name,
          address: `${c.address}, ${c.city}`,
          source: 'zefix',
          added: false,
        }));
        setResults(prospects);
      }
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToPipeline(prospect: Prospect) {
    await createLead({
      company_name: prospect.name,
      contact_name: null,
      email: null,
      phone: prospect.phone || null,
      website: prospect.website || null,
      address: prospect.address,
      source: `prospector-${prospect.source}`,
      status: 'new',
      score: 50,
      notes: `Found via Lead Prospector (${prospect.source})`,
    });
    setResults(prev =>
      prev.map(r => r.id === prospect.id ? { ...r, added: true } : r)
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Lead Prospector</h1>
        <p className="text-gray-500">Find new potential clients automatically from Google Maps & Swiss registry</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="e.g. régie immobilière, property manager..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative w-full md:w-48">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="City..."
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSource('google')}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${source === 'google' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Google Maps
            </button>
            <button
              onClick={() => setSource('zefix')}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${source === 'zefix' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Zefix CH
            </button>
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !keyword.trim()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">{results.length} results found</p>
          {results.map(prospect => (
            <div key={prospect.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                  <h3 className="font-semibold text-gray-900 truncate">{prospect.name}</h3>
                  {prospect.rating && (
                    <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3" /> {prospect.rating}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-2">{prospect.address}</p>
                <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                  {prospect.phone && (
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{prospect.phone}</span>
                  )}
                  {prospect.website && (
                    <a href={prospect.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline">
                      <Globe className="w-3 h-3" />{prospect.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleAddToPipeline(prospect)}
                disabled={prospect.added}
                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  prospect.added
                    ? 'bg-green-50 text-green-600 cursor-default'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {prospect.added ? (
                  <><CheckCircle className="w-4 h-4" /> Added</>
                ) : (
                  <><Plus className="w-4 h-4" /> Add to Pipeline</>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && !error && (
        <div className="text-center py-16 text-gray-400">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Search for businesses to find new leads</p>
        </div>
      )}
    </div>
  );
}
