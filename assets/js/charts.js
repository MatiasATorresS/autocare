/* ==========================================================================
   AutoCare v2 — Gráficos SVG livianos (sin librerías externas)
   ========================================================================== */
window.AC = window.AC || {};

(function (AC) {
  'use strict';

  const esc = AC.esc;
  const fmtShort = AC.fmtShort;
  const fmt = AC.fmt;

  let gradientSeq = 0;

  const PALETTE = ['#b5461f', '#98620f', '#4d6b2f', '#2f6b66', '#a52a1f', '#8a6a45', '#7a4a2b', '#c98a2e'];

  function empty(el, message) {
    el.innerHTML = '<div class="chart-empty">' + esc(message || 'Sin datos disponibles') + '</div>';
  }

  function niceMax(value) {
    if (!value || value <= 0) return 100;
    const pow = Math.pow(10, Math.floor(Math.log10(value)));
    const n = value / pow;
    const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return step * pow;
  }

  function smoothPath(points) {
    if (!points.length) return '';
    if (points.length === 1) return 'M' + points[0][0] + ',' + points[0][1];
    let d = 'M' + points[0][0] + ',' + points[0][1];
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ' C' + c1x.toFixed(1) + ',' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ',' + c2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
    }
    return d;
  }

  /**
   * Gráfico de líneas con área.
   * options: { labels: string[], values: number[], money?: boolean, color?: string }
   */
  function lineChart(el, options) {
    if (!el) return;
    const labels = options.labels || [];
    const values = (options.values || []).map((v) => Number(v) || 0);
    if (!labels.length) return empty(el);

    const color = options.color || 'var(--brand)';
    const W = 520, H = 228;
    const pad = { top: 18, right: 16, bottom: 30, left: 58 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;
    const max = niceMax(Math.max.apply(null, values.concat([0])));

    const x = (i) => pad.left + (labels.length === 1 ? plotW / 2 : (i * plotW) / (labels.length - 1));
    const y = (v) => pad.top + plotH - (v / max) * plotH;

    const points = values.map((v, i) => [x(i), y(v)]);
    const area = smoothPath(points) +
      ' L' + x(values.length - 1).toFixed(1) + ',' + (pad.top + plotH) +
      ' L' + x(0).toFixed(1) + ',' + (pad.top + plotH) + ' Z';

    const gid = 'grad' + (++gradientSeq);
    let svg = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(options.ariaLabel || 'Gráfico de ingresos') + '">';
    svg += '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + color + '" stop-opacity="0.26"/>' +
      '<stop offset="100%" stop-color="' + color + '" stop-opacity="0"/>' +
      '</linearGradient></defs>';

    /* Grilla + eje Y */
    const ticks = 4;
    for (let t = 0; t <= ticks; t++) {
      const value = (max / ticks) * t;
      const yy = y(value);
      svg += '<line class="grid-line" x1="' + pad.left + '" y1="' + yy.toFixed(1) + '" x2="' + (W - pad.right) + '" y2="' + yy.toFixed(1) + '"/>';
      svg += '<text x="' + (pad.left - 10) + '" y="' + (yy + 4).toFixed(1) + '" text-anchor="end">' + (options.money ? fmtShort(value) : AC.fmtNum(value)) + '</text>';
    }

    /* Área y línea */
    svg += '<path d="' + area + '" fill="url(#' + gid + ')"/>';
    svg += '<path class="line-path" d="' + smoothPath(points) + '" fill="none" stroke="' + color + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>';

    /* Puntos + etiquetas X */
    points.forEach((p, i) => {
      svg += '<circle class="dot" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.6" fill="var(--surface)" stroke="' + color + '" stroke-width="2.2">' +
        '<title>' + esc(labels[i] + ': ' + (options.money ? fmt(values[i]) : AC.fmtNum(values[i]))) + '</title></circle>';
      const anchor = i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle';
      const tx = i === 0 ? p[0] - 2 : i === labels.length - 1 ? p[0] + 2 : p[0];
      svg += '<text x="' + tx.toFixed(1) + '" y="' + (H - 8) + '" text-anchor="' + anchor + '">' + esc(labels[i]) + '</text>';
    });

    svg += '</svg>';
    el.innerHTML = svg;
  }

  /**
   * Barras horizontales (ideal para categorías con nombres largos).
   * options: { items: [{label, value}], money?: boolean, color?: string, unit?: string }
   */
  function barChart(el, options) {
    if (!el) return;
    const items = (options.items || []).filter((i) => i && i.value !== undefined);
    if (!items.length) return empty(el);

    const color = options.color || 'var(--brand)';
    const rowH = 40;
    const W = 520;
    const labelW = 120;
    const valueW = options.money ? 74 : 46;
    const barX = labelW + 10;
    const barW = W - barX - valueW - 10;
    const H = items.length * rowH + 6;
    const max = Math.max.apply(null, items.map((i) => Number(i.value) || 0).concat([1]));

    let svg = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(options.ariaLabel || 'Gráfico de barras') + '">';

    items.forEach((item, i) => {
      const value = Number(item.value) || 0;
      const width = Math.max(3, (value / max) * barW);
      const yy = i * rowH + 9;
      const barColor = item.color || color;
      let label = String(item.label || '');
      if (label.length > 18) label = label.slice(0, 17) + '…';
      svg += '<text x="0" y="' + (yy + 16) + '" text-anchor="start">' + esc(label) + '</text>';
      svg += '<rect x="' + barX + '" y="' + yy + '" width="' + barW + '" height="18" rx="9" fill="var(--surface-3)"/>';
      svg += '<rect class="bar" x="' + barX + '" y="' + yy + '" width="' + width.toFixed(1) + '" height="18" rx="9" fill="' + barColor + '" style="animation-delay:' + (i * 55) + 'ms">' +
        '<title>' + esc(item.label + ': ' + (options.money ? fmt(value) : AC.fmtNum(value) + (options.unit ? ' ' + options.unit : ''))) + '</title></rect>';
      svg += '<text x="' + (W - 2) + '" y="' + (yy + 15) + '" text-anchor="end" style="font-weight:650;fill:var(--text-2)">' +
        (options.money ? fmtShort(value) : AC.fmtNum(value)) + '</text>';
    });

    svg += '</svg>';
    el.innerHTML = svg;
  }

  /**
   * Dona con leyenda.
   * options: { items: [{label, value, color}], centerLabel?: string }
   */
  function donutChart(el, options) {
    if (!el) return;
    const items = (options.items || []).filter((i) => Number(i.value) > 0);
    const total = items.reduce((acc, i) => acc + (Number(i.value) || 0), 0);
    if (!total) return empty(el);

    const size = 220, cx = size / 2, cy = size / 2, r = 78, stroke = 24;
    const circumference = 2 * Math.PI * r;
    const gap = items.length > 1 ? 2.5 : 0;

    let offset = 0;
    let svg = '<svg class="chart" viewBox="0 0 ' + size + ' ' + size + '" style="max-width:230px;margin:0 auto" role="img" aria-label="' + esc(options.ariaLabel || 'Gráfico circular') + '">';
    svg += '<g transform="rotate(-90 ' + cx + ' ' + cy + ')">';
    items.forEach((item, i) => {
      const value = Number(item.value) || 0;
      const length = Math.max(0, (value / total) * circumference - gap);
      const color = item.color || PALETTE[i % PALETTE.length];
      svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + stroke + '"' +
        ' stroke-dasharray="' + length.toFixed(2) + ' ' + circumference.toFixed(2) + '"' +
        ' stroke-dashoffset="' + (-offset).toFixed(2) + '" stroke-linecap="butt">' +
        '<title>' + esc(item.label + ': ' + AC.fmtNum(value)) + '</title></circle>';
      offset += (value / total) * circumference;
    });
    svg += '</g>';
    svg += '<text x="' + cx + '" y="' + (cy - 4) + '" text-anchor="middle" style="font-size:26px;font-weight:750;fill:var(--text)">' + AC.fmtNum(total) + '</text>';
    svg += '<text x="' + cx + '" y="' + (cy + 16) + '" text-anchor="middle" style="font-size:11px;fill:var(--muted)">' + esc(options.centerLabel || 'total') + '</text>';
    svg += '</svg>';

    svg += '<div class="chart-legend">';
    items.forEach((item, i) => {
      const color = item.color || PALETTE[i % PALETTE.length];
      svg += '<span class="legend-item"><span class="legend-dot" style="background:' + color + '"></span>' +
        esc(item.label) + ' <strong style="color:var(--text-2);font-weight:650">' + AC.fmtNum(item.value) + '</strong></span>';
    });
    svg += '</div>';

    el.innerHTML = svg;
  }

  AC.charts = {
    line: lineChart,
    bars: barChart,
    donut: donutChart,
    palette: PALETTE,
    empty: empty
  };
})(window.AC);
