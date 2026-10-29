// Contact Form 7 front-end: required-field validation and the same response
// messages/classes as the plugin. Submissions go to VITE_FORM_ENDPOINT (JSON POST).
const ENDPOINT = import.meta.env.VITE_FORM_ENDPOINT;

const MSG = {
  required: 'Toto pole je povinné.',
  email: 'Zadaná e-mailová adresa nie je platná.',
  invalid: 'Jedno alebo viac polí obsahuje chybu. Prosím skontrolujte ich a skúste to znova.',
  sent: 'Ďakujeme za Vašu správu. Bola odoslaná.',
  failed: 'Pri pokuse o odoslanie správy došlo k chybe. Prosím skúste to znova neskôr.',
};

function setTip(control, message) {
  const wrap = control.closest('.wpcf7-form-control-wrap') || control.parentElement;
  wrap.querySelector('.wpcf7-not-valid-tip')?.remove();
  control.classList.toggle('wpcf7-not-valid', !!message);
  control.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (message) {
    const tip = document.createElement('span');
    tip.className = 'wpcf7-not-valid-tip';
    tip.textContent = message;
    wrap.appendChild(tip);
  }
}

async function onSubmit(e) {
  const form = e.target.closest('form.wpcf7-form');
  if (!form) return;
  e.preventDefault();

  const output = form.querySelector('.wpcf7-response-output');
  const setStatus = (status, text) => {
    form.className = form.className.replace(/\b(init|invalid|sent|failed|submitting)\b/g, '').trim() + ` ${status}`;
    form.dataset.status = status;
    if (output) output.textContent = text;
  };

  let valid = true;
  form.querySelectorAll('.wpcf7-form-control:not([type="submit"])').forEach((control) => {
    const value = control.value?.trim() ?? '';
    let message = '';
    if (control.classList.contains('wpcf7-validates-as-required') && !value) message = MSG.required;
    else if (control.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = MSG.email;
    if (message) valid = false;
    setTip(control, message);
  });
  if (!valid) return setStatus('invalid', MSG.invalid);

  const data = Object.fromEntries(
    [...new FormData(form)].filter(([key]) => !key.startsWith('_'))
  );
  setStatus('submitting', '');
  try {
    if (!ENDPOINT) throw new Error('VITE_FORM_ENDPOINT is not set');
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form: form.closest('.wpcf7')?.id, page: location.pathname, ...data }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    form.reset();
    setStatus('sent', MSG.sent);
  } catch (err) {
    console.error('[contact form]', err);
    setStatus('failed', MSG.failed);
  }
}

export function initForms(root) {
  root.addEventListener('submit', onSubmit);
  return () => root.removeEventListener('submit', onSubmit);
}
