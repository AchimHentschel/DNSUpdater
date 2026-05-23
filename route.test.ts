import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { GET } from './route';
import { NextRequest } from 'next/server';

const handlers = [
  http.get('https://api.digitalocean.com/v2/domains/example.com/records', () => {
    return HttpResponse.json({
      domain_records: [{ id: 123, type: 'A', name: 'home', data: '1.1.1.1' }]
    });
  }),
  http.put('https://api.digitalocean.com/v2/domains/example.com/records/123', () => {
    return HttpResponse.json({
      domain_record: { id: 123, type: 'A', name: 'home', data: '1.2.3.4' }
    });
  }),
];

const server = setupServer(...handlers);

describe('GET /api/v1/domains/updateRecord', () => {
  beforeAll(() => {
    server.listen();
    process.env.API_KEY = 'test_key';
  });
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('updates the record successfully when parameters are valid', async () => {
    const url = 'http://localhost/api/v1/domains/updateRecord?domain=example.com&recordName=home&ip=1.2.3.4';
    const req = new NextRequest(url);
    
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.domain_record.data).toBe('1.2.3.4');
  });

  it('returns 400 when IP is invalid', async () => {
    const url = 'http://localhost/api/v1/domains/updateRecord?domain=example.com&recordName=home&ip=not-an-ip';
    const req = new NextRequest(url);
    
    const response = await GET(req);
    expect(response.status).toBe(400);
  });
});