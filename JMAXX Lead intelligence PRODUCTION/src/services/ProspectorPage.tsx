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
          name:
