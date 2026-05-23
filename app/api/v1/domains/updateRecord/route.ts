import { NextRequest, NextResponse } from 'next/server';

interface DigitalOceanRecord {
  id: number;
  type: string;
  name: string;
  data: string;
}

interface DigitalOceanListResponse {
  domain_records: DigitalOceanRecord[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');
  const recordName = searchParams.get('recordName');
  const ip = searchParams.get('ip');

  if (!domain || !recordName || !ip) {
    return NextResponse.json(
      { error: 'Missing query parameters: domain, recordName, and ip are required.' },
      { status: 400 }
    );
  }

  // 1. Authentication (Basic Auth) matching README requirements
  const authHeader = request.headers.get('authorization');
  const expectedUser = process.env.USERNAME;
  const expectedPass = process.env.PASSWORD;
  const apiKey = process.env.API_KEY;

  if (!expectedUser || !expectedPass || !apiKey) {
    return NextResponse.json(
      { error: 'Server configuration error: USERNAME, PASSWORD, or API_KEY is not set.' },
      { status: 500 }
    );
  }

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return NextResponse.json({ error: 'User has not been authenticated.' }, { status: 401 });
  }

  const base64Credentials = authHeader.split(' ')[1];
  if (!base64Credentials) {
    return NextResponse.json({ error: 'Invalid Authorization header format.' }, { status: 401 });
  }

  const credentials = Buffer.from(base64Credentials, 'base64').toString().split(':');
  if (credentials.length !== 2) {
    return NextResponse.json({ error: 'Invalid credentials format.' }, { status: 401 });
  }

  if (credentials[0] !== expectedUser || credentials[1] !== expectedPass) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
  }

  try {
    // 3. List Records to find the record ID (equivalent to DomainController.swift logic)
    const listResponse = await fetch(`https://api.digitalocean.com/v2/domains/${domain}/records`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!listResponse.ok) throw new Error(`DigitalOcean API failed: ${listResponse.statusText}`);

    const { domain_records }: DigitalOceanListResponse = await listResponse.json();
    const record = domain_records.find((r) => r.name === recordName && r.type === 'A');

    if (!record) {
      return NextResponse.json({ error: `Could not find A record with name '${recordName}'` }, { status: 400 });
    }

    // 4. Update the record with the new IP
    const updateResponse = await fetch(`https://api.digitalocean.com/v2/domains/${domain}/records/${record.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: ip }),
    });

    if (!updateResponse.ok) throw new Error(`Update failed: ${updateResponse.statusText}`);

    const data = await updateResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}