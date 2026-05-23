import { NextRequest, NextResponse } from 'next/server';
import { updateDomainRecord } from '../../../../lib/digitalOcean';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');
  const recordName = searchParams.get('recordName');
  const ip = searchParams.get('ip');

  if (!domain || !recordName || !ip) {
    console.warn('[API Route] Missing required parameters: domain=%s, recordName=%s, ip=%s', domain, recordName, ip);
    return NextResponse.json(
      { error: 'Missing query parameters: domain, recordName, and ip are required.' },
      { status: 400 }
    );
  }

  // Authentication is handled by middleware.ts
  // We only need to ensure the API_KEY is configured for the DigitalOcean request.
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Server configuration error: API_KEY is not set.' },
      { status: 500 }
    );
  }

  console.log('[API Route] Processing update request - Domain: %s, Record: %s, IP: %s', domain, recordName, ip);

  try {
    const result = await updateDomainRecord(apiKey, domain, recordName, ip);
    console.log('[API Route] Update completed successfully for %s.%s', recordName, domain);
    return NextResponse.json({ domain_record: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[API Route] Error during DNS update: %s', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}