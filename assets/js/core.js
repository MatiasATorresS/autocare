/* ==========================================================================
   AutoCare v2 — Utilidades de interfaz (sin dependencias)
   Expone todo bajo window.AC
   ========================================================================== */
window.AC = window.AC || {};

(function (AC) {
  'use strict';

  /* ---------- Selectores ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));
  AC.$ = $;
  AC.$$ = $$;

  /* ---------- Texto y números ---------- */
  const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (value) => String(value === null || value === undefined ? '' : value)
    .replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
  AC.esc = esc;

  const fmt = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CL');
  AC.fmt = fmt;

  const fmtNum = (n) => Number(n || 0).toLocaleString('es-CL');
  AC.fmtNum = fmtNum;

  const fmtShort = (n) => {
    const v = Math.round(Number(n) || 0);
    if (Math.abs(v) >= 1000000) return '$' + (v / 1000000).toLocaleString('es-CL', { maximumFractionDigits: 1 }) + 'M';
    if (Math.abs(v) >= 1000) return '$' + Math.round(v / 1000) + 'k';
    return '$' + v;
  };
  AC.fmtShort = fmtShort;

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  AC.clamp = clamp;

  const sum = (arr, fn) => arr.reduce((acc, item) => acc + (fn ? fn(item) : item), 0);
  AC.sum = sum;

  const plural = (n, one, many) => (Number(n) === 1 ? one : many);
  AC.plural = plural;

  /* ---------- Fechas (siempre en horario local, nunca UTC) ---------- */
  const isoOf = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  };
  AC.isoOf = isoOf;

  const todayISO = () => isoOf(new Date());
  AC.todayISO = todayISO;

  const parseISO = (iso) => new Date(String(iso) + 'T00:00:00');
  AC.parseISO = parseISO;

  const addDaysISO = (iso, days) => {
    const d = parseISO(iso);
    d.setDate(d.getDate() + days);
    return isoOf(d);
  };
  AC.addDaysISO = addDaysISO;

  const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  AC.capitalize = capitalize;

  const fmtDate = (iso, opts) => {
    if (!iso) return '—';
    const d = parseISO(iso);
    if (isNaN(d.getTime())) return '—';
    const o = opts || { day: '2-digit', month: 'short', year: 'numeric' };
    return capitalize(d.toLocaleDateString('es-CL', o).replace(/\./g, ''));
  };
  AC.fmtDate = fmtDate;

  const fmtDateShort = (iso) => fmtDate(iso, { day: '2-digit', month: 'short' });
  AC.fmtDateShort = fmtDateShort;

  const daysBetween = (fromISO, toISO) => {
    const a = parseISO(fromISO), b = parseISO(toISO);
    return Math.round((b - a) / 86400000);
  };
  AC.daysBetween = daysBetween;

  const monthKey = (iso) => String(iso || '').slice(0, 7);
  AC.monthKey = monthKey;

  const monthLabel = (key) => {
    const d = parseISO(key + '-01');
    if (isNaN(d.getTime())) return key;
    return capitalize(d.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' }).replace(/\./g, ''));
  };
  AC.monthLabel = monthLabel;

  const monthKeyOf = (date) => isoOf(date).slice(0, 7);
  AC.monthKeyOf = monthKeyOf;

  const relativeDate = (iso) => {
    if (!iso) return '—';
    const diff = daysBetween(todayISO(), iso);
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Mañana';
    if (diff === -1) return 'Ayer';
    if (diff > 1 && diff <= 7) return 'En ' + diff + ' días';
    if (diff < -1 && diff >= -7) return 'Hace ' + Math.abs(diff) + ' días';
    return fmtDate(iso);
  };
  AC.relativeDate = relativeDate;

  const ageLabel = (createdISO) => {
    if (!createdISO) return '';
    const diff = daysBetween(createdISO, todayISO());
    if (diff <= 0) return 'hoy';
    if (diff === 1) return 'hace 1 día';
    if (diff < 30) return 'hace ' + diff + ' días';
    const months = Math.floor(diff / 30);
    if (months < 12) return 'hace ' + months + (months === 1 ? ' mes' : ' meses');
    return 'hace ' + Math.floor(months / 12) + ' años';
  };
  AC.ageLabel = ageLabel;

  /* ---------- Texto de búsqueda ---------- */
  const normalize = (s) => String(s === null || s === undefined ? '' : s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  AC.normalize = normalize;

  const matches = (haystack, needle) => normalize(haystack).indexOf(normalize(needle)) !== -1;
  AC.matches = matches;

  /* ---------- Identificadores ---------- */
  const uid = (prefix) => (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  AC.uid = uid;

  /* ---------- Iconos e iniciales ---------- */
  const icon = (name, cls) => '<svg class="icon ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';
  AC.icon = icon;

  const initials = (name) => {
    const parts = String(name || '?').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  AC.initials = initials;

  const hueFor = (text) => {
    let h = 0;
    const s = String(text || '');
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return h;
  };
  AC.hueFor = hueFor;

  const avatar = (name, cls) => {
    const hue = hueFor(name);
    return '<span class="avatar ' + (cls || '') + '" style="--av:' + hue + '" aria-hidden="true">' + esc(initials(name)) + '</span>';
  };
  AC.avatar = avatar;

  /* ---------- Formularios ---------- */
  const val = (id) => {
    const el = document.getElementById(id);
    return el ? el.value : '';
  };
  AC.val = val;

  const numVal = (id) => {
    const n = Number(val(id));
    return isNaN(n) ? 0 : n;
  };
  AC.numVal = numVal;

  const formData = (form) => {
    const out = {};
    new FormData(form).forEach((v, k) => { out[k] = typeof v === 'string' ? v.trim() : v; });
    return out;
  };
  AC.formData = formData;

  const debounce = (fn, wait) => {
    let timer;
    return function () {
      const args = arguments, ctx = this;
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(ctx, args), wait);
    };
  };
  AC.debounce = debounce;

  /* ---------- Tema ---------- */
  const THEME_KEY = 'autocare.theme';
  const systemDark = () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  const getThemePref = () => {
    try { return localStorage.getItem(THEME_KEY) || 'system'; } catch (e) { return 'system'; }
  };
  AC.getThemePref = getThemePref;

  const applyTheme = (pref) => {
    const dark = pref === 'dark' || (pref === 'system' && systemDark());
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme-pref', pref);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#070d18' : '#f4f6fb');
    AC.$$('.theme-opt').forEach((b) => b.classList.toggle('active', b.dataset.themeOpt === pref));
    if (AC.onThemeChange) AC.onThemeChange(dark ? 'dark' : 'light');
  };
  AC.applyTheme = applyTheme;

  const setTheme = (pref) => {
    try { localStorage.setItem(THEME_KEY, pref); } catch (e) { /* sin storage */ }
    applyTheme(pref);
  };
  AC.setTheme = setTheme;

  const cycleTheme = () => {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    const next = dark ? 'light' : 'dark';
    setTheme(next);
    return next;
  };
  AC.cycleTheme = cycleTheme;

  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => { if (getThemePref() === 'system') applyTheme('system'); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  /* ---------- Toasts ---------- */
  const TOAST_ICON = { success: 'check', error: 'alert', warning: 'alert', info: 'info' };
  const toast = (message, type, ms) => {
    const host = document.getElementById('toasts');
    if (!host) return;
    const kind = TOAST_ICON[type] ? type : 'success';
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.setAttribute('role', 'status');
    el.innerHTML = icon(TOAST_ICON[kind]) + '<div class="toast-msg">' + esc(message) + '</div>';
    host.appendChild(el);
    const life = ms || 3400;
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 220);
    }, life);
  };
  AC.toast = toast;

  /* ---------- Modal ---------- */
  let modalOnClose = null;
  let modalLastFocus = null;
  let modalOpen = false;

  const overlayEl = () => document.getElementById('overlay');

  const closeModal = () => {
    const overlay = overlayEl();
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    modalOpen = false;
    document.body.style.overflow = '';
    const cb = modalOnClose;
    modalOnClose = null;
    if (modalLastFocus && modalLastFocus.focus) {
      try { modalLastFocus.focus({ preventScroll: true }); } catch (e) { /* noop */ }
    }
    modalLastFocus = null;
    if (cb) cb();
  };
  AC.closeModal = closeModal;

  const trapFocus = (event) => {
    const modal = document.getElementById('modal');
    if (!modal) return;
    const focusables = $$(
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      modal
    ).filter((el) => el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const openModal = (opts) => {
    const options = opts || {};
    const overlay = overlayEl();
    const modal = document.getElementById('modal');
    if (!overlay || !modal) return function () {};

    document.getElementById('modalTitle').textContent = options.title || '';
    document.getElementById('modalBody').innerHTML = options.body || '';

    const foot = document.getElementById('modalFoot');
    if (options.footer) {
      foot.innerHTML = options.footer;
      foot.hidden = false;
    } else {
      foot.innerHTML = '';
      foot.hidden = true;
    }

    modal.className = 'modal' + (options.size ? ' ' + options.size : '');
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    document.getElementById('modalBody').scrollTop = 0;
    modalLastFocus = document.activeElement;
    modalOnClose = options.onClose || null;
    modalOpen = true;

    requestAnimationFrame(() => {
      const target = modal.querySelector('[data-autofocus]') ||
        modal.querySelector('.modal-body input:not([type="hidden"]), .modal-body select, .modal-body textarea') ||
        modal.querySelector('.modal-foot .btn-primary, .modal-foot .btn-danger, .modal-foot .btn');
      if (target) { try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); } }
    });

    if (typeof options.onMount === 'function') options.onMount(modal, overlay);
    return closeModal;
  };
  AC.openModal = openModal;

  document.addEventListener('keydown', (event) => {
    const overlay = overlayEl();
    if (!overlay || overlay.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key === 'Tab') trapFocus(event);
  });

  /* Cierre al hacer clic fuera del cuadro */
  document.addEventListener('click', (event) => {
    if (event.target && event.target.id === 'overlay') closeModal();
  });

  const confirmDialog = (opts) => {
    const options = opts || {};
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      const danger = options.danger !== false;
      openModal({
        title: options.title || 'Confirmar acción',
        size: 'sm',
        body: '<div class="confirm-icon">' + icon(danger ? 'alert' : 'info') + '</div>' +
          '<p style="font-size:13.5px;color:var(--text-2);line-height:1.6">' + (options.message || '¿Deseas continuar?') + '</p>',
        footer: '<button class="btn btn-ghost" data-cancel>' + esc(options.cancelText || 'Cancelar') + '</button>' +
          '<button class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + '" data-ok>' + esc(options.confirmText || 'Eliminar') + '</button>',
        onMount: (modal) => {
          modal.querySelector('[data-cancel]').onclick = () => { finish(false); closeModal(); };
          modal.querySelector('[data-ok]').onclick = () => { finish(true); closeModal(); };
        },
        onClose: () => finish(false)
      });
    });
  };
  AC.confirm = confirmDialog;

  /* ---------- Impresión ---------- */
  const printHTML = (html) => {
    const area = document.getElementById('printArea');
    if (!area) return;
    area.innerHTML = html;
    const cleanup = () => {
      area.innerHTML = '';
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => {
      window.print();
      /* Respaldo para navegadores que no disparan afterprint */
      setTimeout(cleanup, 1500);
    }, 80);
  };
  AC.printHTML = printHTML;

  /* ---------- Escape / accesibilidad ---------- */
  const ariaBool = (v) => (v ? 'true' : 'false');
  AC.ariaBool = ariaBool;
})(window.AC);
