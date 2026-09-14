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
    const accept = request.headers.get('accept') || '*/*';
    proxyHeaders.set('Accept', accept);
    const userAgent = request.headers.get('user-agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
    proxyHeaders.set('User-Agent', userAgent);
    proxyHeaders.set('Referer', 'https://archive.org/');

    // archive.org's /download/ 302-redirects to a CDN node; fetch's
    // automatic redirect-follow drops the Range header on the redirect,
    // so we resolve the redirect manually and then fetch the CDN URL
    // with full Range headers intact.
    let resolvedUrl = upstreamUrl.toString();
    const firstResp = await fetch(resolvedUrl, {
      method: 'GET',
      headers: proxyHeaders,
      redirect: 'manual',
    });
    const location = firstResp.headers.get('location');
    if (location && (firstResp.status === 301 || firstResp.status === 302 || firstResp.status === 307 || firstResp.status === 308)) {
      try {
        resolvedUrl = new URL(location, resolvedUrl).toString();
      } catch {
        // if location is absolute it's fine, if relative and broken just use original
      }
    } else {
      // no redirect — use the original response directly
      const respHeaders = new Headers(firstResp.headers);
      respHeaders.set('Access-Control-Allow-Origin', '*');
      if (range) respHeaders.set('X-Forwarded-Range', range);
      respHeaders.set('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length, Content-Type');
      return new Response(firstResp.body, { status: firstResp.status, headers: respHeaders });
    }

    const upstream = await fetch(resolvedUrl, {
      method: 'GET',
      headers: proxyHeaders,
      redirect: 'follow',
    });

    const responsesHeaders = new Headers(upstream.headers);
    responsesHeaders.set('Access-Control-Allow-Origin', '*');
    responsesHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    responsesHeaders.set('Access-Control-Allow-Headers', 'Range, If-Range, Content-Type');
    if (range) responsesHeaders.set('X-Forwarded-Range', range);
    responsesHeaders.set(
      'Access-Control-Expose-Headers',
      'Content-Range, Accept-Ranges, Content-Length, Content-Type'
    );
    // Cache static media at edge for faster repeated seeks and smoother playback
    if (upstream.status === 200 || upstream.status === 206) {
      responsesHeaders.set('Cache-Control', 'public, max-age=14400, s-maxage=86400');
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responsesHeaders,
    });
  } catch (err) {
    return new Response('proxy error: ' + err.message, { status: 502 });
  }
}
