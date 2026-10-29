// Replaces the Complianz cookie banner script: shows the banner until the visitor
// decides, remembers the choice, and unblocks YouTube embeds once marketing is allowed.
const KEY = 'cmplz_consent';

export function getConsent() {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

function setConsent(value) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Storage blocked — the choice only lasts for this page view.
  }
}

const youtubeId = (url) => url.match(/(?:youtu\.be\/|embed\/|v=)([\w-]{11})/)?.[1];

// Show placeholders for blocked embeds, or swap in the real players when allowed.
export function applyEmbeds(root, allowed) {
  root.querySelectorAll('iframe[data-src-cmplz]').forEach((frame) => {
    if (allowed) {
      frame.src = frame.dataset.srcCmplz;
      frame.removeAttribute('data-src-cmplz');
      frame.classList.remove('cmplz-placeholder-element');
      frame.style.backgroundImage = '';
    } else if (frame.dataset.placeholderImage) {
      frame.style.backgroundImage = `url('${frame.dataset.placeholderImage}')`;
      frame.classList.add('cmplz-blocked');
    }
  });

  root.querySelectorAll('video.cmplz-wp-video-shortcode').forEach((video) => {
    const holder = video.closest('.wp-video') || video;
    const src = video.querySelector('source[type="video/youtube"]')?.getAttribute('src') || '';
    const id = youtubeId(src);
    if (allowed && id) {
      const frame = document.createElement('iframe');
      frame.src = `https://www.youtube.com/embed/${id}`;
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      frame.allowFullscreen = true;
      frame.className = 'yt-embed';
      holder.replaceWith(frame);
    } else if (!holder.querySelector('.cmplz-blocked-content')) {
      holder.classList.add('cmplz-blocked');
      holder.style.backgroundImage = `url('${video.dataset.placeholderImage}')`;
      video.style.display = 'none';
      const notice = document.createElement('div');
      notice.className = 'cmplz-blocked-content';
      notice.innerHTML = '<button type="button" class="cmplz-blocked-content-notice cmplz-accept-marketing">Kliknite na tlačidlo, aby ste povolili video</button>';
      holder.appendChild(notice);
    }
  });
}

// Wire up the banner markup imported from the live site.
export function initConsent(banner, manageButton, onChange) {
  const bannerEl = banner.querySelector('.cmplz-cookiebanner');
  if (!bannerEl) return () => {};
  const checkboxes = [...bannerEl.querySelectorAll('.cmplz-consent-checkbox')];
  const viewPrefs = bannerEl.querySelector('.cmplz-view-preferences');
  const savePrefs = bannerEl.querySelector('.cmplz-save-preferences');
  const manage = manageButton.querySelector('.cmplz-manage-consent');

  const show = (visible) => {
    bannerEl.classList.toggle('cmplz-hidden', !visible);
    bannerEl.classList.toggle('cmplz-show', visible);
    manage?.classList.toggle('cmplz-hidden', visible);
  };

  const showPreferences = (open) => {
    bannerEl.classList.toggle('cmplz-categories-visible', open);
    bannerEl.querySelector('.cmplz-categories')?.classList.toggle('cmplz-fade-in', open);
    viewPrefs?.style.setProperty('display', open ? 'none' : '');
    savePrefs?.style.setProperty('display', open ? 'block' : 'none');
  };

  const decide = (value) => {
    setConsent(value);
    show(false);
    onChange(value);
  };

  const all = (on) => ({ functional: true, preferences: on, statistics: on, marketing: on });

  const onClick = (e) => {
    const t = e.target.closest('button, a, .cmplz-close');
    if (!t) return;
    if (t.matches('.cmplz-accept')) decide(all(true));
    else if (t.matches('.cmplz-deny, .cmplz-close')) decide(all(false));
    else if (t.matches('.cmplz-view-preferences, .cmplz-manage-options')) {
      e.preventDefault();
      showPreferences(true);
    } else if (t.matches('.cmplz-save-preferences')) {
      const value = all(false);
      checkboxes.forEach((cb) => {
        const cat = [...cb.classList].find((c) => ['preferences', 'statistics', 'marketing'].includes(c));
        if (cat) value[cat] = cb.checked;
      });
      decide(value);
    } else if (t.matches('.cmplz-category-toggle')) {
      const desc = t.closest('.cmplz-category')?.querySelector('.cmplz-description');
      if (desc) desc.hidden = !desc.hidden;
    } else return;
  };

  const onManage = () => {
    const current = getConsent();
    checkboxes.forEach((cb) => {
      const cat = [...cb.classList].find((c) => ['functional', 'preferences', 'statistics', 'marketing'].includes(c));
      cb.checked = cat === 'functional' || !!current?.[cat];
    });
    show(true);
  };

  // "Allow video" buttons inside blocked embeds.
  const onDocClick = (e) => {
    if (!e.target.closest('.cmplz-accept-marketing')) return;
    e.preventDefault();
    decide({ ...(getConsent() || all(false)), marketing: true });
  };

  bannerEl.addEventListener('click', onClick);
  manage?.addEventListener('click', onManage);
  document.addEventListener('click', onDocClick);
  if (savePrefs) savePrefs.style.display = 'none';
  show(!getConsent());

  return () => {
    bannerEl.removeEventListener('click', onClick);
    manage?.removeEventListener('click', onManage);
    document.removeEventListener('click', onDocClick);
  };
}
