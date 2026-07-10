export interface ZefixCompany {
  uid: string;
  name: string;
  address: string;
  city: string;
  canton: string;
  legalForm: string;
  status: string;
}

export async function searchZefix(query: string): Promise<ZefixCompany[]> {
  const response = await fetch(
    `https://www.zefix.ch/ZefixREST/api/v1/firm/search.json?name=${encodeURIComponent(query)}&maxEntries=20`
  );
  const data = await response.json();
  return (data.list || []).map((item: any) => ({
    uid: item.uid?.uid || '',
    name: item.name || '',
    address: item.address?.street || '',
    city: item.address?.city || '',
    canton: item.address?.canton || '',
    legalForm: item.legalForm?.name?.fr || '',
    status: item.status || '',
  }));
}
