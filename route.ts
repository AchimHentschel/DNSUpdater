import { NextRequest, NextResponse } from 'next/server';
import { updateDomainRecord } from '@/lib/digitalOcean';
import { z } from 'zod';

const querySchema = z.object({
  domain: z.string().min(1),
  recordName: z.string().min(1),
  ip: z.string().ip(),
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = {
    domain: searchParams.get('domain'),
    recordName: searchParams.get('recordName'),
    ip: searchParams.get('ip'),
  };

  const result = querySchema.safeParse(query);

  if (!result.success) {
    return NextResponse.json({ error: result.error.format() }, { status: 400 });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API_KEY is missing' }, { status: 500 });
  }

  try {
    const updatedRecord = await updateDomainRecord(apiKey, result.data.domain, result.data.recordName, result.data.ip);
    return NextResponse.json({ domain_record: updatedRecord });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}