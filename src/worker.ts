const ARCHIVE_URL = /^https:\/\/([a-z0-9-]+\.)*archive\.org\//i;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/mproxy') {
      const target = url.searchParams.get('u');
      if (!target) {
        return new Response('missing u', { status: 400 });
      }

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

      let upstreamUrl;
      try {
        upstreamUrl = new URL(target);
      } catch {
        return new Response('invalid u', { status: 400 });
      }

      if (!/^https:$/i.test(upstreamUrl.protocol) || !ARCHIVE_URL.test(upstreamUrl.origin + '/')) {
        return new Response('forbidden host', { status: 403 });
      }

      try {
        const proxyHeaders = new Headers();
        const range = request.headers.get('range');
        if (range) proxyHeaders.set('Range', range);
        const ifRange = request.headers.get('if-range');
        if (ifRange) proxyHeaders.set('If-Range', ifRange);
        const accept = request.headers.get('accept');
        if (accept) proxyHeaders.set('Accept', accept);
        const userAgent = request.headers.get('user-agent');
        if (userAgent) proxyHeaders.set('User-Agent', userAgent);

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

        const respHeaders = new Headers(upstream.headers);
        respHeaders.set('Access-Control-Allow-Origin', '*');
        if (range) respHeaders.set('X-Forwarded-Range', range);
        respHeaders.set('X-Resolved-Url', resolvedUrl);
        respHeaders.set(
          'Access-Control-Expose-Headers',
          'Content-Range, Accept-Ranges, Content-Length, Content-Type'
        );

        return new Response(upstream.body, {
          status: upstream.status,
          headers: respHeaders,
        });
      } catch (err) {
        return new Response('proxy error: ' + err.message, { status: 502 });
      }
    }

    return env.ASSETS.fetch(request);
  },
};
