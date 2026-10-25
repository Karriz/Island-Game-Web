// Stream the exported Unity data from files below GitHub's per-file limit.
(() => {
  const originalFetch = window.fetch.bind(window);
  const dataUrl = new URL('Build/Web.data.unityweb', document.baseURI).href;
  const totalLength = 490344934;
  const chunkCount = 10;
  window.fetch = async function(input, options = {}) {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, document.baseURI).href;
    if (url !== dataUrl) return originalFetch(input, options);
    const headers = {'Content-Type': 'application/octet-stream', 'Content-Length': String(totalLength)};
    const method = (options.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    if (method === 'HEAD') return new Response(null, {status: 200, headers});
    let part = 0;
    let reader;
    const stream = new ReadableStream({
      async pull(controller) {
        try {
          while (part < chunkCount || reader) {
            if (!reader) {
              const chunkUrl = new URL('Build/Web.data.part' + String(part++).padStart(3, '0') + '?v=' + totalLength, document.baseURI);
              const response = await originalFetch(chunkUrl, options);
              if (!response.ok) throw new Error('Game data download failed: ' + response.status + ' ' + chunkUrl);
              reader = response.body.getReader();
            }
            const result = await reader.read();
            if (!result.done) { controller.enqueue(result.value); return; }
            reader.releaseLock();
            reader = null;
          }
          controller.close();
        } catch (error) { controller.error(error); }
      },
      cancel(reason) { return reader ? reader.cancel(reason) : undefined; }
    });
    return new Response(stream, {status: 200, headers});
  };
})();