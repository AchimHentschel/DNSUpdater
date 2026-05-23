const BASE_URL = 'https://api.digitalocean.com/v2';

export interface DomainRecord {
  id: number;
  type: string;
  name: string;
  data: string;
}

export async function updateDomainRecord(
  apiKey: string,
  domain: string,
  recordName: string,
  ip: string
) {
  // 1. List records to find the ID
  const listUrl = `${BASE_URL}/domains/${domain}/records`;
  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!listRes.ok) {
    throw new Error(`Failed to list records: ${listRes.statusText}`);
  }

  const { domain_records }: { domain_records: DomainRecord[] } = await listRes.json();
  const record = domain_records.find((r) => r.name === recordName && r.type === 'A');

  if (!record) {
    throw new Error(`Could not find A record with name '${recordName}'`);
  }

  // 2. Update the record
  const updateUrl = `${BASE_URL}/domains/${domain}/records/${record.id}`;
  const updateRes = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ data: ip }),
  });

  if (!updateRes.ok) {
    throw new Error(`Failed to update record: ${updateRes.statusText}`);
  }

  const data = await updateRes.json();
  return data.domain_record;
}