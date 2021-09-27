/// <reference types="@cloudflare/workers-types" />

import forwardingRules from './rules';

/**
 * Webhook events are recorded in Cloudflare KV
 */
declare var RECORD: KVNamespace;

type Payload = {
  body: string,
  headers: Record<string, string>,
};

addEventListener('fetch', event => {
  event.respondWith(
    handleRequest(event.request),
  );
});

addEventListener('scheduled', event => {
  event.waitUntil(handleSchedule());
});

async function handleRequest(request: Request): Promise<Response> {
  for (const rule of forwardingRules) {
    if (rule.match(request)) {
      const body = await request.text();
      const headers = Object.fromEntries(request.headers.entries());
      await RECORD.put(rule.key, JSON.stringify({ body, headers }));
      return new Response(undefined, { status: 204 });
    }
  }
  return new Response('Request not allowed by Webhook Debouncer', { status: 403 });
}

async function handleSchedule(): Promise<void> {
  for (const rule of forwardingRules) {
    const { body, headers } = await RECORD.get(rule.key, 'json') as Payload;
    if (body) {
      await fetch(rule.target, {
        method: 'POST',
        body,
        headers,
      });
      await RECORD.delete(rule.key);
    }
  }
}
