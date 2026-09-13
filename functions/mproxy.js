const ARCHIVE_URL = /^https:\/\/([a-z0-9-]+\.)*archive\.org\//i;

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, If-Range',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const target = url.searchParams.get('u');
  if (!target) {
    return new Response('missing u', { status: 400 });
  }

  let upstreamUrl;
  try {
    upstreamUrl = new URL(target);
  } catch (err) {
    return new Response('invalid u', { status: 400 });
  }

  // Only allow proxying files from archive.org (+ its CDN hosts) to keep
  // this endpoint from being abused as an open proxy.
  if (!/^https:$/i.test(upstreamUrl.protocol) || !ARCHIVE_URL.test(upstreamUrl.origin + '/')) {
    return new Response('forbidden host', { status: 403 });
  }

  try {
    // Explicitly forward Ranged reads so archive.org returns 206 instead
    // of streaming the entire file back to us.
    const proxyHeaders = new Headers();
    const range = request.headers.get('range');
    if (range) proxyHeaders.set('Range', range);
    const ifRange = request.headers.get('if-range');
    if (ifRange) proxyHeaders.set('If-Range', ifRange);
    const accept = request.headers.get('accept');
    if (accept) proxyHeaders.set('Accept', accept);
    const userAgent = request.headers.get('user-agent');
    if (userAgent) proxyHeaders.set('User-Agent', userAgent);

    const upstream = await fetch(upstreamUrl.toString(), {
      method: request.method === 'HEAD' ? 'HEAD' : 'GET',
      headers: proxyHeaders,
      redirect: 'follow',
    });

    const responsesHeaders = new Headers(upstream.headers);
    responsesHeaders.set('Access-Control-Allow-Origin', '*');
    if (range) responsesHeaders.set('X-Forwarded-Range', range);
    responsesHeaders.set(
      'Access-Control-Expose-Headers',
      'Content-Range, Accept-Ranges, Content-Length, Content-Type'
    );

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responsesHeaders,
    });
  } catch (err) {
    return new Response('proxy error: ' + err.message, { status: 502 });
  }
}
