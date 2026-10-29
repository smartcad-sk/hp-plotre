// Mirrors hpplotre.sk into this project:
//  - crawls every page/post (WP REST API list + internal links found while crawling)
//  - saves each page's #wrapper-content markup, title, body class and inline CSS to public/data/pages/
//  - saves the shared header / off-canvas menu / footer / cookie banner to public/data/layout.json
//  - concatenates the theme + plugin stylesheets into public/site.css
//  - downloads every referenced image, font, PDF… into public/ (same paths as on the server)
//
// Usage: npm run import

import * as cheerio from 'cheerio';
import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';

const ORIGIN = 'https://hpplotre.sk';
const HOST_RE = /(?:https?:)?\/\/(?:www\.)?hpplotre\.sk/;
const PUBLIC = path.resolve('public');
const UA = { 'User-Agent': 'Mozilla/5.0 (hpplotre-react importer)' };
const MAX_PAGES = 400;

const assets = new Map(); // remote URL -> local path
const pages = new Map(); // route -> page data
const sliders = {};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, as = 'text', tries = 3) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: UA, redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { res, body: as === 'buffer' ? Buffer.from(await res.arrayBuffer()) : await res.text() };
    } catch (err) {
      if (i >= tries) throw new Error(`${url}: ${err.message}`);
      await sleep(500 * i);
    }
  }
}

const exists = (p) => access(p).then(() => true, () => false);

async function save(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, data);
}

// Turn a remote asset URL into a local root-relative URL and queue it for download.
function localAsset(url) {
  const u = new URL(url);
  const local = u.hostname.endsWith('hpplotre.sk') ? u.pathname : `/ext/${u.hostname}${u.pathname}`;
  if (!assets.has(u.origin + u.pathname)) assets.set(u.origin + u.pathname, local);
  return local;
}

const isAssetPath = (p) => /\.[a-z0-9]{2,5}$/i.test(p) || p.startsWith('/wp-content/') || p.startsWith('/wp-includes/');

// Rewrite every hpplotre.sk URL: files become local assets, everything else a router path.
function rewriteUrls(text) {
  return text
    .replace(/(?:https?:)?\/\/(?:www\.)?hpplotre\.sk(\/[^"'\s)<>,]*)?/g, (m, p = '/') => {
      const u = new URL(p, ORIGIN);
      return isAssetPath(u.pathname) ? localAsset(u.href) : u.pathname + u.hash;
    })
    .replace(/https:\/\/s\.w\.org\/images\/core\/emoji\/[^"'\s)]+/g, (m) => localAsset(m));
}

// Rewrite url(...) and @import inside a stylesheet located at cssUrl.
function rewriteCss(css, cssUrl) {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, ref) => {
    if (ref.startsWith('data:') || ref.startsWith('#')) return m;
    const abs = new URL(ref, cssUrl);
    if (!/^https?:$/.test(abs.protocol)) return m;
    if (abs.hostname.includes('googleapis') || abs.hostname.includes('gstatic')) return `url('${abs.href}')`;
    return `url('${localAsset(abs.href)}${abs.hash}')`;
  });
}

function normalizeRoute(href) {
  try {
    const u = new URL(href, ORIGIN);
    if (!HOST_RE.test('//' + u.hostname)) return null;
    let p = decodeURI(u.pathname);
    if (isAssetPath(p) || /^\/(wp-json|wp-admin|wp-login|feed|xmlrpc|comments)/.test(p) || /\/feed\/?$/.test(p)) return null;
    if (u.search) return null;
    if (!p.endsWith('/')) p += '/';
    return p;
  } catch {
    return null;
  }
}

const stylesheets = []; // ordered, unique

function collectStylesheets($) {
  $('link[rel="stylesheet"]').each((_, el) => {
    let href = $(el).attr('href');
    if (!href) return;
    if (href.startsWith('//')) href = 'https:' + href;
    if (!stylesheets.includes(href)) stylesheets.push(href);
  });
}

function parseSliders($) {
  $('script').each((_, el) => {
    const js = $(el).html() || '';
    const m = js.match(/\$\('#([\w-]+)'\)\.swiper\(\{([\s\S]*?)\}\);/);
    if (!m) return;
    const opts = m[2];
    sliders[m[1]] = {
      effect: /effect:\s*'fade'/.test(opts) ? 'fade' : 'slide',
      loop: /loop:\s*true/.test(opts),
      autoplay: Number(opts.match(/autoplay:\s*(\d+)/)?.[1] || 0),
      autoHeight: /layers_swiper_resize\(/.test(js),
    };
  });
}

// Prepare markup for React: strip scripts, unwrap consent-blocked iframes into placeholders.
function cleanMarkup($, $root) {
  $root.find('script').remove();
  $root.find('[srcset]').removeAttr('srcset');
  $root.find('[sizes]').removeAttr('sizes');
  $root.find('img[data-src]').each((_, el) => {
    $(el).attr('src', $(el).attr('data-src'));
  });
  $root.find('iframe[data-src-cmplz]').each((_, el) => {
    const $el = $(el);
    $el.attr('src', 'about:blank');
    const ph = $el.attr('data-placeholder-image');
    if (ph) $el.attr('data-placeholder-image', ph);
  });
}

// Posts (and the blog archive) crash on the live server after the article body (HTTP 500),
// so they are rebuilt from the REST API using the theme's single/archive markup.
const posts = new Map(); // route -> REST post
const dateFmt = new Intl.DateTimeFormat('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' });

function postMeta(post) {
  return `<h5 class="meta-info"><p><span class="meta-item meta-date"><i class="l-clock-o"></i> ${dateFmt.format(new Date(post.date))}</span></p></h5>`;
}

function postImage(post, link) {
  const src = post._embedded?.['wp:featuredmedia']?.[0]?.media_details?.sizes?.large?.source_url
    || post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
  if (!src) return '';
  const img = `<img src="${src}" class="attachment-large size-large" alt="" />`;
  return `<div class="thumbnail push-bottom">${link ? `<a href="${link}">${img}</a>` : img}</div>`;
}

function postPage(route, post) {
  const html = `
<div class="content-main clearfix post-${post.id} post type-post status-publish format-standard hentry category-blog container">
  <div class="grid">
    <article id="post-${post.id}" class="column span-12">
      <header class="section-title large">${postMeta(post)}<h1 class="heading">${post.title.rendered}</h1></header>
      ${postImage(post)}
      <div class="story">${post.content.rendered}</div>
    </article>
  </div>
</div>`;
  return {
    route,
    title: `${post.title.rendered} - HPplotre.sk`,
    description: cheerio.load(post.excerpt.rendered).text().trim().slice(0, 160),
    bodyClass: `post-template-default single single-post postid-${post.id} single-format-standard wp-theme-layerswp layers-header-sticky`,
    css: '',
    html: rewriteUrls(html),
  };
}

function archivePage(route) {
  const items = [...posts.values()]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((post) => {
      const link = normalizeRoute(post.link);
      return `
      <article id="post-${post.id}" class="push-bottom-large post-${post.id} post type-post status-publish format-standard hentry category-blog">
        ${postImage(post, link)}
        <header class="section-title large">${postMeta(post)}<h1 class="heading"><a href="${link}">${post.title.rendered}</a></h1></header>
        <div class="copy">${post.excerpt.rendered}</div>
        <p><a href="${link}" class="button">Čítať viac</a></p>
      </article>`;
    })
    .join('');
  const html = `
<div class="title-container"><div class="title"><h3 class="heading">Blog</h3></div></div>
<div class="container content-main archive clearfix"><div class="grid"><div class="column span-12">${items}</div></div></div>`;
  return {
    route,
    title: 'Blog - HPplotre.sk',
    description: '',
    bodyClass: 'archive category category-blog wp-theme-layerswp layers-header-sticky',
    css: '',
    html: rewriteUrls(html),
  };
}

async function crawlPage(route) {
  if (posts.has(route)) {
    pages.set(route, postPage(route, posts.get(route)));
    return [];
  }
  if (route === '/category/blog/') {
    pages.set(route, archivePage(route));
    return [];
  }
  const url = ORIGIN + encodeURI(route);
  const { res, body } = await get(url);
  const finalRoute = normalizeRoute(res.url);
  if (finalRoute && finalRoute !== route) {
    // Redirect: remember it and crawl the target instead.
    pages.set(route, { redirect: finalRoute });
    return finalRoute;
  }
  const $ = cheerio.load(body, { decodeEntities: false });
  collectStylesheets($);
  parseSliders($);

  const links = new Set();
  $('a[href]').each((_, el) => {
    const r = normalizeRoute($(el).attr('href'));
    if (r) links.add(r);
  });

  const $content = $('#wrapper-content');
  cleanMarkup($, $content);

  const styles = [];
  $('style').each((_, el) => {
    const css = $(el).html() || '';
    if (/wp-admin-bar/.test(css)) return;
    styles.push(css.trim());
  });

  const data = {
    route,
    title: $('title').text().trim(),
    description: $('meta[name="description"]').attr('content') || '',
    bodyClass: $('body').attr('class') || '',
    css: rewriteCss(rewriteUrls(styles.join('\n')), url),
    html: rewriteUrls($content.html() || ''),
  };
  pages.set(route, data);

  if (route === '/') {
    const $site = $('.wrapper-site');
    const part = (sel) => {
      const $el = $(sel).first();
      cleanMarkup($, $el);
      return rewriteUrls($.html($el) || '');
    };
    await save(
      path.join(PUBLIC, 'data/layout.json'),
      JSON.stringify(
        {
          offCanvas: part('#off-canvas-right'),
          headerSecondary: part($site.children('.header-secondary')),
          header: part('section.header-site'),
          footer: part('#footer'),
          cookieBanner: part('#cmplz-cookiebanner-container'),
          manageConsent: part('#cmplz-manage-consent'),
          stickyBreakpoint: Number(body.match(/"header_sticky_breakpoint":"(\d+)"/)?.[1] || 270),
        },
        null,
        1
      )
    );
  }
  return [...links];
}

async function crawl() {
  const seed = new Set(['/']);
  const { body: pageList } = await get(`${ORIGIN}/wp-json/wp/v2/pages?per_page=100&_fields=link`);
  for (const { link } of JSON.parse(pageList)) {
    const r = normalizeRoute(link);
    if (r) seed.add(r);
  }
  const { body: postList } = await get(`${ORIGIN}/wp-json/wp/v2/posts?per_page=100&_embed=wp:featuredmedia`);
  for (const post of JSON.parse(postList)) {
    const r = normalizeRoute(post.link);
    if (!r) continue;
    posts.set(r, post);
    seed.add(r);
  }
  seed.add('/category/blog/');

  const queue = [...seed];
  const seen = new Set(queue);
  while (queue.length && pages.size < MAX_PAGES) {
    const batch = queue.splice(0, 6);
    const results = await Promise.all(
      batch.map((r) =>
        crawlPage(r).catch((err) => {
          console.warn('  ! skip', r, err.message);
          return [];
        })
      )
    );
    for (const found of results) {
      for (const r of [].concat(found)) {
        if (!seen.has(r)) {
          seen.add(r);
          queue.push(r);
        }
      }
    }
    console.log(`pages: ${pages.size}  queued: ${queue.length}`);
  }
}

async function buildStylesheet() {
  let out = '/* Generated by scripts/import.mjs — original hpplotre.sk stylesheets */\n';
  const fonts = [];
  for (const href of stylesheets) {
    if (href.includes('fonts.googleapis.com')) {
      fonts.push(href.replace(/&#038;/g, '&'));
      continue;
    }
    try {
      const { body } = await get(href);
      out += `\n/* ${new URL(href).pathname} */\n${rewriteCss(body, href)}\n`;
    } catch (err) {
      console.warn('  ! css', err.message);
    }
  }
  await save(path.join(PUBLIC, 'site.css'), out);
  return fonts;
}

async function downloadAssets() {
  // CSS files may reference other assets, so loop until the queue stops growing.
  const done = new Set();
  let failed = 0;
  for (;;) {
    const todo = [...assets].filter(([remote]) => !done.has(remote));
    if (!todo.length) break;
    for (let i = 0; i < todo.length; i += 8) {
      await Promise.all(
        todo.slice(i, i + 8).map(async ([remote, local]) => {
          done.add(remote);
          const file = path.join(PUBLIC, decodeURIComponent(local));
          if (await exists(file)) return;
          try {
            const { body } = await get(remote, 'buffer');
            await save(file, body);
          } catch (err) {
            failed++;
            console.warn('  ! asset', err.message);
          }
        })
      );
      process.stdout.write(`\rassets: ${done.size}/${assets.size}`);
    }
  }
  console.log(failed ? `\n${failed} assets failed` : '');
}

console.log('Crawling hpplotre.sk…');
await crawl();

const index = {};
for (const [route, data] of pages) {
  if (data.redirect) {
    index[route] = { redirect: data.redirect };
    continue;
  }
  const file = route === '/' ? 'index' : route.slice(1, -1).replace(/\//g, '__');
  index[route] = { file, title: data.title };
  data.sliders = Object.fromEntries(
    Object.entries(sliders).filter(([id]) => data.html.includes(`id="${id}"`))
  );
  await save(path.join(PUBLIC, 'data/pages', `${file}.json`), JSON.stringify(data));
}

console.log('Building stylesheet…');
const fonts = await buildStylesheet();
await save(path.join(PUBLIC, 'data/routes.json'), JSON.stringify({ fonts, routes: index }, null, 1));

console.log('Downloading assets…');
await downloadAssets();
console.log(`Done: ${Object.keys(index).length} routes, ${assets.size} assets.`);
