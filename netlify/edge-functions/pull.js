// Временная проверка: может ли посредник скачать большой ответ из Yandex Cloud
export default async (req) => {
  const u = new URL(req.url).searchParams.get('u') || '';
  if (!u.startsWith('https://functions.yandexcloud.net/')) return new Response('bad url', { status: 400 });
  const t = Date.now();
  try {
    const r = await fetch(u);
    const b = await r.arrayBuffer();
    return new Response(`status ${r.status}, bytes ${b.byteLength}, ${Date.now() - t} ms`);
  } catch (e) {
    return new Response(`error ${e} after ${Date.now() - t} ms`);
  }
};

export const config = { path: '/pull' };
