import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import https from 'node:https';

const TRACCAR_URL = process.env.TRACCAR_API_URL || 'https://app.flytr.in';
const agent = new https.Agent({ rejectUnauthorized: false });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('deviceId');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!deviceId || !from || !to) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const jsessionId = cookieStore.get('JSESSIONID')?.value;

  if (!jsessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = `${TRACCAR_URL}/api/reports/trips?deviceId=${deviceId}&from=${from}&to=${to}`;

  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Cookie': `JSESSIONID=${jsessionId}`,
      },
      // @ts-expect-error nextjs extended node fetch
      agent,
    });

    if (!res.ok) {
      console.error('Traccar trips error:', res.status, await res.text());
      return NextResponse.json({ error: 'Failed to fetch trips' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    console.error('Traccar trips proxy error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
