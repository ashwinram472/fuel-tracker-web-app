'use server';

import { cookies } from 'next/headers';
import https from 'node:https';

const TRACCAR_URL = process.env.TRACCAR_API_URL || 'https://app.flytr.in';

// Helper to disable cert checks if needed (same as traccar.ts)
const agent = new https.Agent({ rejectUnauthorized: false });

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  try {
    const url = `${TRACCAR_URL}/api/session`;
    const body = new URLSearchParams();
    body.append('email', email);
    body.append('password', password);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: body.toString(),
      // @ts-expect-error next.js passes down agent
      agent, 
      redirect: 'manual', 
      cache: 'no-store'
    });

    if (res.status >= 200 && res.status < 300) {
      // Extract JSESSIONID from set-cookie header
      const setCookieHeader = res.headers.get('set-cookie');
      if (setCookieHeader) {
        // Find the JSESSIONID cookie string, multiple cookies are separated by commas in Fetch API usually,
        // but set-cookie can be complex.
        const cookiesStrings = setCookieHeader.split(',');
        let jsessionIdValue = '';
        
        for (const cookieStr of cookiesStrings) {
           const match = cookieStr.match(/JSESSIONID=([^;]+)/);
           if (match && match[1]) {
             jsessionIdValue = match[1];
             break;
           }
        }

        if (jsessionIdValue) {
          const cookieStore = await cookies();
          cookieStore.set('JSESSIONID', jsessionIdValue, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week (Traccar usually allows long sessions)
          });
          
          return { success: true };
        }
      }
      return { error: 'Login successful, but no session returned from Traccar.' };
    } else {
      let msg = 'Invalid email or password';
      if (res.status === 401 || res.status === 404) {
         msg = 'Invalid email or password'; // Standard unauthorized
      } else {
         msg = `Error authenticating: ${res.status}`;
      }
      return { error: msg };
    }
  } catch (e: any) {
    console.error('Login action error:', e);
    return { error: e.message || 'An unexpected error occurred connection to Traccar.' };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('JSESSIONID');
  return { success: true };
}
