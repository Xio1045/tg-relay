// Посредник между Telegram и функцией в Yandex Cloud (из РФ api.telegram.org недоступен).
//   POST /hook       — вебхук от Telegram → пересылается в функцию Yandex Cloud
//   /tg/bot<token>/… — запросы бота к Telegram API → api.telegram.org
//   /tg/file/bot<…>  — скачивание файлов → api.telegram.org
export const config = { matcher: '/:path*' };

const TELEGRAM = 'https://api.telegram.org';
const TARGET = 'https://functions.yandexcloud.net/d4etbhq1gl4g126ft7d4';

export default async function middleware(req, ctx) {
  const url = new URL(req.url);

  if (url.pathname === '/hook' && req.method === 'POST') {
    const forward = fetch(TARGET, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-telegram-bot-api-secret-token': req.headers.get('x-telegram-bot-api-secret-token') || '',
      },
      body: await req.text(),
    });
    // Отвечаем Telegram сразу, чтобы долгая обработка (проверка почты) не вызывала повторов
    if (ctx && ctx.waitUntil) {
      ctx.waitUntil(forward);
      return new Response('ok');
    }
    const r = await forward;
    return new Response(await r.text(), { status: r.status });
  }

  if (url.pathname.startsWith('/tg/')) {
    const headers = new Headers();
    const contentType = req.headers.get('content-type');
    if (contentType) headers.set('content-type', contentType);
    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    const r = await fetch(TELEGRAM + url.pathname.slice(3) + url.search, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
    });
    return new Response(r.body, {
      status: r.status,
      headers: { 'content-type': r.headers.get('content-type') || 'application/octet-stream' },
    });
  }

  return new Response('relay ok');
}
