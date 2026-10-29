import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import RawHtml from './RawHtml.jsx';
import { initSliders } from './lib/sliders.js';
import { applyEmbeds, getConsent, initConsent } from './lib/consent.js';
import { initForms } from './lib/forms.js';

// Data produced by `npm run import`.
const loadJson = (url) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error(url))));
const sitePromise = Promise.all([loadJson('/data/layout.json'), loadJson('/data/routes.json')]);
const pageCache = new Map();

function normalize(pathname) {
  // Some WordPress links contain a stray " /" at the end (e.g. "/hp-designjet-z6/ /").
  let p = decodeURI(pathname).replace(/(\/\s+)+\/?$/, '/');
  if (!p.endsWith('/')) p += '/';
  return p;
}

// Routes are matched case-insensitively, like WordPress slugs.
function findRoute(routes, path) {
  if (routes[path]) return [path, routes[path]];
  const lower = path.toLowerCase();
  return Object.entries(routes).find(([r]) => r.toLowerCase() === lower) || [path, null];
}

const isFile = (path) => /\.[a-z0-9]{2,5}$/i.test(path);

export default function App() {
  const [site, setSite] = useState(null);
  const [page, setPage] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const contentRef = useRef(null);
  const offCanvasRef = useRef(null);
  const headerRef = useRef(null);
  const cookieRef = useRef(null);
  const manageRef = useRef(null);

  useEffect(() => {
    sitePromise.then(([layout, { routes }]) => setSite({ layout, routes }));
  }, []);

  const path = normalize(location.pathname);
  const [routeKey, route] = site ? findRoute(site.routes, path) : [path, null];

  // Load the page JSON for the current route.
  useEffect(() => {
    if (!site) return;
    if (!route || route.redirect) {
      setPage(route ? null : { notFound: true });
      return;
    }
    let cancelled = false;
    const file = `/data/pages/${encodeURIComponent(route.file)}.json`;
    if (!pageCache.has(file)) pageCache.set(file, loadJson(file));
    pageCache.get(file).then((data) => !cancelled && setPage(data));
    return () => {
      cancelled = true;
    };
  }, [site, routeKey, route]);

  // Head + body attributes per page.
  useLayoutEffect(() => {
    if (!page || page.notFound) {
      if (page?.notFound) document.title = 'Stránka sa nenašla - HPplotre.sk';
      return;
    }
    document.title = page.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', page.description);
    document.body.className = page.bodyClass;
    document.body.dataset.cmplz = '1';
    window.scrollTo(0, location.hash ? window.scrollY : 0);
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }, [page]);

  // Same-site links navigate inside the app; toggles open the off-canvas menu.
  useEffect(() => {
    const onClick = (e) => {
      const toggle = e.target.closest('[data-toggle^="#"]');
      if (toggle) {
        e.preventDefault();
        document.querySelector(toggle.dataset.toggle)?.classList.toggle(toggle.dataset.toggleClass);
        return;
      }
      if (e.target.closest('.close-canvas')) {
        e.preventDefault();
        offCanvasRef.current?.querySelector('.off-canvas-right')?.classList.remove('open');
        return;
      }
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const href = a.getAttribute('href');
      if (href === '' || href === '#') return e.preventDefault();
      if (href === '#top') {
        e.preventDefault();
        return window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      const url = new URL(href, location.href);
      if (url.origin !== window.location.origin || isFile(url.pathname) || a.target === '_blank') return;
      e.preventDefault();
      offCanvasRef.current?.querySelector('.off-canvas-right')?.classList.remove('open');
      navigate(url.pathname + url.hash);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [navigate]);

  // Highlight the current menu item (WordPress renders it server-side per page).
  useEffect(() => {
    if (!site) return;
    document.querySelectorAll('.menu-item').forEach((li) => {
      const a = li.querySelector(':scope > a');
      const href = a && normalize(new URL(a.getAttribute('href'), window.location.origin).pathname);
      const current = href === path && a.origin === window.location.origin;
      li.classList.toggle('current-menu-item', current);
      li.classList.toggle('current_page_item', current);
    });
    document.querySelectorAll('.menu-item-has-children').forEach((li) => {
      li.classList.toggle('current-menu-parent', !!li.querySelector('.sub-menu .current-menu-item'));
    });
  }, [site, path, page]);

  // Sticky header (Layers uses waypoints + sticky-kit).
  useEffect(() => {
    if (!site) return;
    const header = headerRef.current?.querySelector('section.header-sticky');
    if (!header) return;
    const breakpoint = site.layout.stickyBreakpoint;
    const spacer = document.createElement('div');
    let stuck = false;
    let timeout;
    const onScroll = () => {
      const shouldStick = window.scrollY > breakpoint;
      if (shouldStick === stuck) return;
      stuck = shouldStick;
      clearTimeout(timeout);
      if (stuck) {
        spacer.style.height = `${header.offsetHeight}px`;
        header.after(spacer);
        Object.assign(header.style, { position: 'fixed', top: '0', left: '0', width: '100%', zIndex: 100 });
        header.classList.add('is_stuck');
        timeout = setTimeout(() => header.classList.add('is_stuck_show'), 10);
      } else {
        header.classList.remove('is_stuck', 'is_stuck_show');
        header.removeAttribute('style');
        spacer.remove();
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timeout);
      spacer.remove();
    };
  }, [site]);

  // Cookie banner + consent-gated embeds.
  const [consent, setConsent] = useState(getConsent);
  useEffect(() => {
    if (!site) return;
    return initConsent(cookieRef.current, manageRef.current, setConsent);
  }, [site]);

  // Per-page widgets: sliders, forms, embeds.
  useEffect(() => {
    const root = contentRef.current;
    if (!root || !page?.html) return;
    const stopSliders = initSliders(root, page.sliders);
    const stopForms = initForms(root);
    return () => {
      stopSliders();
      stopForms();
    };
  }, [page]);

  useEffect(() => {
    if (contentRef.current && page?.html) applyEmbeds(contentRef.current, !!consent?.marketing);
  }, [page, consent]);

  if (!site) return null;
  if (route?.redirect) return <Navigate to={route.redirect} replace />;

  const { layout } = site;
  return (
    <>
      {page?.css && <style>{page.css}</style>}
      <RawHtml ref={offCanvasRef} html={layout.offCanvas} />
      <div className="wrapper-site">
        <RawHtml ref={headerRef} html={layout.headerSecondary + layout.header} />
        {page?.notFound ? (
          <section id="wrapper-content" className="wrapper-content">
            <div className="container content-main clearfix">
              <div className="section-title large">
                <h1 className="heading">Stránka sa nenašla</h1>
                <p className="excerpt">
                  Požadovaná stránka neexistuje. <a href="/">Späť na úvod</a>
                </p>
              </div>
            </div>
          </section>
        ) : (
          page && (
            <section id="wrapper-content" className="wrapper-content">
              <RawHtml key={page.route} ref={contentRef} html={page.html} />
            </section>
          )
        )}
        <RawHtml html={layout.footer} />
      </div>
      <RawHtml ref={cookieRef} html={layout.cookieBanner} />
      <RawHtml ref={manageRef} html={layout.manageConsent} />
    </>
  );
}
