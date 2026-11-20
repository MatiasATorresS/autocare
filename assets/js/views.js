/* ==========================================================================
   AutoCare v2 — Vistas, formularios y documentos
   Cada vista devuelve HTML; app.js se encarga del ruteo y los eventos.
   ========================================================================== */
window.AC = window.AC || {};

(function (AC) {
  'use strict';

  const S = AC.store;
  const esc = AC.esc;
  const fmt = AC.fmt;
  const fmtNum = AC.fmtNum;
  const icon = AC.icon;
  const D = () => S.data;

  /* ---------- Estado de filtros de la interfaz ---------- */
  const ui = {
    q: { ordenes: '', clientes: '', vehiculos: '', repuestos: '' },
    estado: 'Todas'
  };
  AC.ui = ui;

  /* ---------- Helpers de presentación ---------- */
  const estadoBadge = (estado) => '<span class="badge ' + (S.ESTADO_CLASS[estado] || 'b-soft') + '">' + esc(estado) + '</span>';

  const timelineHTML = (estado) => {
    const idx = Math.max(0, S.ESTADOS.indexOf(estado));
    return '<div class="timeline">' +
      '<div class="tl-head"><span>Progreso</span><span>Paso ' + (idx + 1) + ' de ' + S.ESTADOS.length + '</span></div>' +
      '<div class="tl-track">' + S.ESTADOS.map((e, i) =>
        '<span class="tl-seg ' + (i < idx ? 'done' : i === idx ? 'current' : '') + '" title="' + esc(e) + '"></span>').join('') + '</div>' +
      '<div class="tl-ends"><span>' + esc(S.ESTADOS[0]) + '</span><span>' + esc(S.ESTADOS[S.ESTADOS.length - 1]) + '</span></div>' +
      '</div>';
  };

  const emptyState = (iconName, title, text, actionHtml) =>
    '<div class="empty">' +
    '<span class="empty-icon">' + icon(iconName) + '</span>' +
    '<strong>' + esc(title) + '</strong>' +
    (text ? '<p>' + esc(text) + '</p>' : '') +
    (actionHtml || '') +
    '</div>';

  const rowEmpty = (colspan, iconName, title, text) =>
    '<tr><td colspan="' + colspan + '">' + emptyState(iconName, title, text) + '</td></tr>';

  const kpi = (opts) =>
    '<div class="kpi">' +
    '<div class="kpi-top"><span class="kpi-icon ' + (opts.tone || '') + '">' + icon(opts.icon) + '</span></div>' +
    '<div class="kpi-value ' + (opts.small ? 'sm' : '') + '">' + opts.value + '</div>' +
    '<div class="kpi-label">' + esc(opts.label) + '</div>' +
    '</div>';

  const panel = (title, subtitle, body, opts) => {
    const o = opts || {};
    const head = title
      ? '<div class="panel-head"><div><div class="panel-title">' + (o.icon ? icon(o.icon) : '') + esc(title) + '</div>' +
        (subtitle ? '<div class="panel-sub">' + esc(subtitle) + '</div>' : '') + '</div>' + (o.actions || '') + '</div>'
      : '';
    return '<section class="panel">' + head + '<div class="panel-body ' + (o.flush ? 'flush' : '') + '">' + body + '</div></section>';
  };

  const tableWrap = (table) => '<div class="table-wrap">' + table + '</div>';

  /* ---------- Dashboard ---------- */
  function dashboard() {
    const today = AC.todayISO();
    const key = AC.monthKey(today);
    const delivered = D().ordenes.filter((o) => o.estado === 'Entregado');
    const active = D().ordenes.filter((o) => o.estado !== 'Entregado');
    const monthRevenue = delivered
      .filter((o) => AC.monthKey(o.fechaEntrega || o.fechaIngreso) === key)
      .reduce((acc, o) => acc + S.orderTotal(o), 0);
    const ticket = S.avgTicket();
    const low = S.lowStock();
    const recent = D().ordenes.slice().sort((a, b) => String(b.fechaIngreso).localeCompare(String(a.fechaIngreso))).slice(0, 5);

    const recentTable = '<table class="table"><thead><tr>' +
      '<th>Orden</th><th>Vehículo</th><th>Cliente</th><th>Estado</th><th class="num">Total</th><th class="actions"></th>' +
      '</tr></thead><tbody>' +
      (recent.length ? recent.map((o) => {
        const v = S.vehiculoById(o.vehiculoId);
        return '<tr>' +
          '<td data-label="Orden"><strong>#' + esc(o.numero) + '</strong><div class="cell-sub">' + AC.fmtDateShort(o.fechaIngreso) + '</div></td>' +
          '<td data-label="Vehículo"><div class="cell-main">' + esc(v ? v.patente : '—') + '</div><div class="cell-sub">' + esc(v ? v.marca + ' ' + v.modelo : '') + '</div></td>' +
          '<td data-label="Cliente">' + esc(S.clienteNombre(o.clienteId)) + '</td>' +
          '<td data-label="Estado">' + estadoBadge(o.estado) + '</td>' +
          '<td data-label="Total" class="num"><strong>' + fmt(S.orderTotal(o)) + '</strong></td>' +
          '<td class="actions" data-label=""><button class="icon-btn sm" data-action="view-order" data-id="' + o.id + '" aria-label="Ver orden" title="Ver orden">' + icon('eye') + '</button></td>' +
          '</tr>';
      }).join('') : rowEmpty(6, 'wrench', 'Sin órdenes todavía', 'Crea la primera orden de trabajo para comenzar.')) +
      '</tbody></table>';

    return '<div class="view">' +
      '<p class="view-lead">' + AC.fmtDate(today, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) +
      ' · <strong>' + active.length + ' ' + AC.plural(active.length, 'orden activa', 'órdenes activas') + '</strong></p>' +

      '<div class="kpi-grid">' +
      kpi({ icon: 'wallet', tone: 'green', value: fmt(monthRevenue), label: 'Ingresos del mes · ' + AC.monthLabel(key), small: monthRevenue > 999999 }) +
      kpi({ icon: 'wrench', value: active.length, label: 'Órdenes activas' }) +
      kpi({ icon: 'activity', tone: 'cyan', value: fmt(ticket), label: 'Ticket promedio', small: true }) +
      kpi({ icon: 'box', tone: low.length ? 'red' : 'green', value: low.length, label: 'Repuestos en alerta' }) +
      '</div>' +

      '<div class="chart-grid">' +
      '<section class="panel"><div class="panel-head"><div class="panel-title">' + icon('chart') + 'Ingresos últimos 6 meses</div>' +
      '<span class="panel-sub">Órdenes entregadas</span></div><div class="panel-body"><div id="chRevenue"></div></div></section>' +
      '<section class="panel"><div class="panel-head"><div class="panel-title">' + icon('activity') + 'Órdenes por estado</div></div>' +
      '<div class="panel-body"><div id="chEstados"></div></div></section>' +
      '</div>' +

      '<div class="mt-20">' +
      panel('Últimas órdenes', 'Movimientos recientes del taller', tableWrap(recentTable), {
        flush: true,
        actions: '<button class="btn btn-sm btn-ghost" data-action="nav" data-route="ordenes">Ver todas' + icon('chevron-right') + '</button>'
      }) +
      '</div>' +
      '</div>';
  }

  /* ---------- Clientes ---------- */
  const clientesFiltrados = () => {
    const q = ui.q.clientes;
    return D().clientes.slice().sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es')).filter((c) => {
      if (!q) return true;
      return AC.matches([c.nombre, c.rut, c.telefono, c.correo, c.direccion].join(' '), q);
    });
  };

  function clientesRows() {
    const list = clientesFiltrados();
    if (!list.length) {
      return rowEmpty(7, 'users', ui.q.clientes ? 'Sin resultados' : 'Aún no hay clientes',
        ui.q.clientes ? 'Prueba con otro nombre, RUT o teléfono.' : 'Registra a tu primer cliente para comenzar.');
    }
    return list.map((c) => {
      const stats = S.clienteStats(c.id);
      return '<tr>' +
        '<td data-label="Cliente"><div class="cell">' + AC.avatar(c.nombre) +
        '<div class="cell-text"><div class="cell-main">' + esc(c.nombre) + '</div><div class="cell-sub">' + esc(c.correo || c.direccion || '—') + '</div></div></div></td>' +
        '<td data-label="RUT" class="mono">' + esc(c.rut || '—') + '</td>' +
        '<td data-label="Teléfono">' + esc(c.telefono || '—') + '</td>' +
        '<td data-label="Vehículos" class="num">' + stats.vehiculos + '</td>' +
        '<td data-label="Órdenes" class="num">' + stats.ordenes + '</td>' +
        '<td data-label="Gasto total" class="num"><strong>' + fmt(stats.gasto) + '</strong></td>' +
        '<td class="actions" data-label="">' +
        '<button class="icon-btn sm" data-action="view-client" data-id="' + c.id + '" title="Ver ficha" aria-label="Ver ficha de ' + esc(c.nombre) + '">' + icon('eye') + '</button>' +
        '<button class="icon-btn sm" data-action="edit-client" data-id="' + c.id + '" title="Editar" aria-label="Editar ' + esc(c.nombre) + '">' + icon('edit') + '</button>' +
        '<button class="icon-btn sm danger" data-action="delete-client" data-id="' + c.id + '" title="Eliminar" aria-label="Eliminar ' + esc(c.nombre) + '">' + icon('trash') + '</button>' +
        '</td></tr>';
    }).join('');
  }

  function clientes() {
    const total = D().clientes.length;
    return '<div class="view">' +
      '<p class="view-lead"><strong>' + total + '</strong> ' + AC.plural(total, 'cliente registrado', 'clientes registrados') + '</p>' +
      '<div class="toolbar">' +
      '<div class="field grow">' + icon('search') + '<input class="input input-search" id="qClientes" placeholder="Buscar por nombre, RUT, teléfono o correo…" value="' + esc(ui.q.clientes) + '"></div>' +
      '<button class="btn btn-primary" data-action="new-client">' + icon('plus') + 'Nuevo cliente</button>' +
      '</div>' +
      panel('', '', tableWrap('<table class="table"><thead><tr><th>Cliente</th><th>RUT</th><th>Teléfono</th><th class="num">Vehículos</th><th class="num">Órdenes</th><th class="num">Gasto total</th><th class="actions"></th></tr></thead><tbody id="clientesBody">' + clientesRows() + '</tbody></table>'), { flush: true }) +
      '</div>';
  }

  /* ---------- Vehículos ---------- */
  const vehiculosFiltrados = () => {
    const q = ui.q.vehiculos;
    return D().vehiculos.slice().sort((a, b) => String(a.patente).localeCompare(String(b.patente))).filter((v) => {
      if (!q) return true;
      return AC.matches([v.patente, v.marca, v.modelo, v.color, v.anio, S.clienteNombre(v.clienteId)].join(' '), q);
    });
  };

  function vehiculosRows() {
    const list = vehiculosFiltrados();
    if (!list.length) {
      return rowEmpty(6, 'car', ui.q.vehiculos ? 'Sin resultados' : 'Aún no hay vehículos',
        ui.q.vehiculos ? 'Prueba con otra patente, marca o cliente.' : 'Registra un vehículo y asígnalo a un cliente.');
    }
    return list.map((v) => {
      const last = S.lastOrderOfVehicle(v.id);
      const maint = S.maintenanceInfo(v);
      return '<tr>' +
        '<td data-label="Vehículo"><div class="cell"><span class="plate">' + esc(v.patente) + '</span>' +
        '<div class="cell-text"><div class="cell-main">' + esc(v.marca + ' ' + v.modelo) + '</div><div class="cell-sub">' + esc((v.anio || '—') + ' · ' + (v.color || 'Sin color')) + '</div></div></div></td>' +
        '<td data-label="Kilometraje" class="num">' + fmtNum(v.km) + ' km</td>' +
        '<td data-label="Dueño">' + esc(S.clienteNombre(v.clienteId)) + '</td>' +
        '<td data-label="Último servicio">' + (last ? estadoBadge(last.estado) + '<div class="cell-sub">' + AC.fmtDateShort(last.fechaIngreso) + '</div>' : '<span class="cell-sub">Sin servicios</span>') + '</td>' +
        '<td data-label="Mantención">' + (maint.due
          ? '<span class="badge b-amber">' + (maint.remaining === 0 ? 'Vencido' : 'En ' + fmtNum(maint.remaining) + ' km') + '</span>'
          : '<span class="cell-sub">En ' + fmtNum(maint.remaining) + ' km</span>') + '</td>' +
        '<td class="actions" data-label="">' +
        '<button class="icon-btn sm" data-action="view-vehicle" data-id="' + v.id + '" title="Ficha" aria-label="Ficha de ' + esc(v.patente) + '">' + icon('eye') + '</button>' +
        '<button class="icon-btn sm" data-action="edit-vehicle" data-id="' + v.id + '" title="Editar" aria-label="Editar ' + esc(v.patente) + '">' + icon('edit') + '</button>' +
        '<button class="icon-btn sm danger" data-action="delete-vehicle" data-id="' + v.id + '" title="Eliminar" aria-label="Eliminar ' + esc(v.patente) + '">' + icon('trash') + '</button>' +
        '</td></tr>';
    }).join('');
  }

  function vehiculos() {
    const total = D().vehiculos.length;
    return '<div class="view">' +
      '<p class="view-lead"><strong>' + total + '</strong> ' + AC.plural(total, 'vehículo registrado', 'vehículos registrados') + '</p>' +
      '<div class="toolbar">' +
      '<div class="field grow">' + icon('search') + '<input class="input input-search" id="qVehiculos" placeholder="Buscar por patente, marca, modelo o dueño…" value="' + esc(ui.q.vehiculos) + '"></div>' +
      '<button class="btn btn-primary" data-action="new-vehicle">' + icon('plus') + 'Nuevo vehículo</button>' +
      '</div>' +
      panel('', '', tableWrap('<table class="table"><thead><tr><th>Vehículo</th><th class="num">Kilometraje</th><th>Dueño</th><th>Último servicio</th><th>Mantención</th><th class="actions"></th></tr></thead><tbody id="vehiculosBody">' + vehiculosRows() + '</tbody></table>'), { flush: true }) +
      '</div>';
  }

  /* ---------- Órdenes ---------- */
  const ordenesFiltradas = () => {
    const q = ui.q.ordenes;
    return D().ordenes.slice().sort((a, b) => (Number(b.numero) || 0) - (Number(a.numero) || 0)).filter((o) => {
      if (ui.estado !== 'Todas' && o.estado !== ui.estado) return false;
      if (!q) return true;
      const v = S.vehiculoById(o.vehiculoId);
      return AC.matches([o.numero, o.mecanico, o.tipo, o.estado, o.observaciones, v ? v.patente + ' ' + v.marca + ' ' + v.modelo : '', S.clienteNombre(o.clienteId)].join(' '), q);
    });
  };

  function ordenesRows() {
    const list = ordenesFiltradas();
    if (!list.length) {
      return rowEmpty(8, 'wrench', ui.q.ordenes || ui.estado !== 'Todas' ? 'Sin resultados' : 'Aún no hay órdenes',
        'Crea una orden de trabajo para empezar a registrar reparaciones.');
    }
    return list.map((o) => {
      const v = S.vehiculoById(o.vehiculoId);
      const next = S.nextEstado(o.estado);
      return '<tr>' +
        '<td data-label="Orden"><strong>#' + esc(o.numero) + '</strong><div class="cell-sub">' + esc(o.tipo) + '</div></td>' +
        '<td data-label="Vehículo"><div class="cell-main">' + esc(v ? v.patente : '—') + '</div><div class="cell-sub">' + esc(v ? v.marca + ' ' + v.modelo : '') + '</div></td>' +
        '<td data-label="Cliente">' + esc(S.clienteNombre(o.clienteId)) + '</td>' +
        '<td data-label="Mecánico">' + esc(o.mecanico || '—') + '</td>' +
        '<td data-label="Fechas"><div class="cell-main" style="font-size:12.5px;font-weight:600">' + AC.fmtDateShort(o.fechaIngreso) + '</div><div class="cell-sub">Entrega: ' + AC.fmtDateShort(o.fechaEntrega) + '</div></td>' +
        '<td data-label="Total" class="num"><strong>' + fmt(S.orderTotal(o)) + '</strong></td>' +
        '<td data-label="Estado">' + estadoBadge(o.estado) + '</td>' +
        '<td class="actions" data-label="">' +
        '<button class="icon-btn sm" data-action="view-order" data-id="' + o.id + '" title="Ver detalle" aria-label="Ver orden ' + esc(o.numero) + '">' + icon('eye') + '</button>' +
        (next ? '<button class="icon-btn sm" data-action="advance-order" data-id="' + o.id + '" title="Avanzar a ' + esc(next) + '" aria-label="Avanzar a ' + esc(next) + '">' + icon('arrow-right') + '</button>' : '') +
        '<button class="icon-btn sm" data-action="invoice-order" data-id="' + o.id + '" title="Factura" aria-label="Factura de la orden ' + esc(o.numero) + '">' + icon('print') + '</button>' +
        '<button class="icon-btn sm" data-action="edit-order" data-id="' + o.id + '" title="Editar" aria-label="Editar orden ' + esc(o.numero) + '">' + icon('edit') + '</button>' +
        '<button class="icon-btn sm danger" data-action="delete-order" data-id="' + o.id + '" title="Eliminar" aria-label="Eliminar orden ' + esc(o.numero) + '">' + icon('trash') + '</button>' +
        '</td></tr>';
    }).join('');
  }

  function ordenes() {
    const counts = { 'Todas': D().ordenes.length };
    S.ESTADOS.forEach((e) => { counts[e] = D().ordenes.filter((o) => o.estado === e).length; });
    const chips = ['Todas'].concat(S.ESTADOS).map((e) =>
      '<button class="chip ' + (ui.estado === e ? 'active' : '') + '" data-action="filter-estado" data-estado="' + esc(e) + '">' +
      esc(e) + ' <span class="count">' + counts[e] + '</span></button>').join('');

    return '<div class="view">' +
      '<div class="toolbar">' +
      '<div class="field grow">' + icon('search') + '<input class="input input-search" id="qOrdenes" placeholder="Buscar por N°, patente, cliente, mecánico…" value="' + esc(ui.q.ordenes) + '"></div>' +
      '</div>' +
      '<div class="chips mb-16">' + chips + '</div>' +
      panel('', '', tableWrap('<table class="table"><thead><tr><th>Orden</th><th>Vehículo</th><th>Cliente</th><th>Mecánico</th><th>Fechas</th><th class="num">Total</th><th>Estado</th><th class="actions"></th></tr></thead><tbody id="ordenesBody">' + ordenesRows() + '</tbody></table>'), { flush: true }) +
      '</div>';
  }

  /* ---------- Repuestos ---------- */
  const repuestosFiltrados = () => {
    const q = ui.q.repuestos;
    return D().repuestos.slice().sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es')).filter((r) => {
      if (!q) return true;
      return AC.matches([r.nombre, r.proveedor].join(' '), q);
    });
  };

  function repuestosRows() {
    const list = repuestosFiltrados();
    if (!list.length) {
      return rowEmpty(5, 'box', ui.q.repuestos ? 'Sin resultados' : 'Aún no hay repuestos',
        'Agrega los repuestos que usas para controlar el inventario.');
    }
    return list.map((r) => {
      const status = S.stockStatus(r);
      const ratio = Math.min(100, (Number(r.stock) / Math.max(1, Number(r.stockMin) * 2)) * 100);
      const cls = status === 'critical' ? 'critical' : status === 'low' ? 'low' : '';
      return '<tr>' +
        '<td data-label="Repuesto"><div class="cell-text"><div class="cell-main">' + esc(r.nombre) + '</div><div class="cell-sub">' + esc(r.proveedor || 'Sin proveedor') + '</div></div></td>' +
        '<td data-label="Stock"><div class="stock-bar"><span style="font-weight:650;min-width:24px">' + fmtNum(r.stock) + '</span><span class="stock-track"><span class="stock-fill ' + cls + '" style="width:' + ratio.toFixed(0) + '%"></span></span></div></td>' +
        '<td data-label="Mínimo" class="num">' + fmtNum(r.stockMin) + '</td>' +
        '<td data-label="Precio" class="num">' + fmt(r.precio) + '</td>' +
        '<td class="actions" data-label="">' +
        '<button class="icon-btn sm" data-action="stock-dec" data-id="' + r.id + '" title="Quitar 1" aria-label="Quitar una unidad de ' + esc(r.nombre) + '">−</button>' +
        '<button class="icon-btn sm" data-action="stock-inc" data-id="' + r.id + '" title="Agregar 1" aria-label="Agregar una unidad de ' + esc(r.nombre) + '">+</button>' +
        '<button class="icon-btn sm" data-action="edit-part" data-id="' + r.id + '" title="Editar" aria-label="Editar ' + esc(r.nombre) + '">' + icon('edit') + '</button>' +
        '<button class="icon-btn sm danger" data-action="delete-part" data-id="' + r.id + '" title="Eliminar" aria-label="Eliminar ' + esc(r.nombre) + '">' + icon('trash') + '</button>' +
        '</td></tr>';
    }).join('');
  }

  function repuestos() {
    const low = S.lowStock();
    const critical = low.filter((r) => S.stockStatus(r) === 'critical').length;
    return '<div class="view">' +
      '<div class="kpi-grid">' +
      kpi({ icon: 'box', value: D().repuestos.length, label: 'Referencias registradas' }) +
      kpi({ icon: 'wallet', tone: 'green', value: fmt(S.inventoryValue()), label: 'Valor del inventario', small: true }) +
      kpi({ icon: 'alert', tone: low.length ? 'amber' : 'green', value: low.length, label: 'Bajo stock mínimo' }) +
      kpi({ icon: 'alert', tone: critical ? 'red' : 'green', value: critical, label: 'Sin stock' }) +
      '</div>' +
      '<div class="toolbar">' +
      '<div class="field grow">' + icon('search') + '<input class="input input-search" id="qRepuestos" placeholder="Buscar repuesto o proveedor…" value="' + esc(ui.q.repuestos) + '"></div>' +
      '<button class="btn btn-primary" data-action="new-part">' + icon('plus') + 'Nuevo repuesto</button>' +
      '</div>' +
      panel('', '', tableWrap('<table class="table"><thead><tr><th>Repuesto</th><th>Stock</th><th class="num">Mínimo</th><th class="num">Precio</th><th class="actions"></th></tr></thead><tbody id="repuestosBody">' + repuestosRows() + '</tbody></table>'), { flush: true }) +
      '</div>';
  }

  /* ==================== Formularios ==================== */
  function formCliente(client) {
    const c = client || {};
    return '<form id="formCliente" autocomplete="off">' +
      '<div class="form-grid">' +
      '<div class="form-row full"><label for="cf_nombre">Nombre completo <span class="req">*</span></label><input class="input" id="cf_nombre" name="nombre" required maxlength="80" value="' + esc(c.nombre || '') + '" data-autofocus></div>' +
      '<div class="form-row"><label for="cf_rut">RUT</label><input class="input" id="cf_rut" name="rut" maxlength="14" placeholder="12.345.678-9" value="' + esc(c.rut || '') + '"></div>' +
      '<div class="form-row"><label for="cf_telefono">Teléfono</label><input class="input" id="cf_telefono" name="telefono" maxlength="25" placeholder="+56 9 1234 5678" value="' + esc(c.telefono || '') + '"></div>' +
      '<div class="form-row"><label for="cf_correo">Correo</label><input class="input" id="cf_correo" name="correo" type="email" maxlength="90" placeholder="cliente@correo.cl" value="' + esc(c.correo || '') + '"></div>' +
      '<div class="form-row"><label for="cf_direccion">Dirección</label><input class="input" id="cf_direccion" name="direccion" maxlength="120" placeholder="Calle 123, comuna" value="' + esc(c.direccion || '') + '"></div>' +
      '</div></form>';
  }

  function formVehiculo(vehicle) {
    const v = vehicle || {};
    const options = D().clientes.map((c) =>
      '<option value="' + c.id + '" ' + (c.id === v.clienteId ? 'selected' : '') + '>' + esc(c.nombre) + '</option>').join('');
    return '<form id="formVehiculo" autocomplete="off">' +
      '<div class="form-grid">' +
      '<div class="form-row"><label for="vf_patente">Patente <span class="req">*</span></label><input class="input" id="vf_patente" name="patente" required maxlength="8" placeholder="ABCD12" style="text-transform:uppercase" value="' + esc(v.patente || '') + '" data-autofocus></div>' +
      '<div class="form-row"><label for="vf_anio">Año</label><input class="input" id="vf_anio" name="anio" type="number" min="1950" max="2100" placeholder="2020" value="' + esc(v.anio || '') + '"></div>' +
      '<div class="form-row"><label for="vf_marca">Marca <span class="req">*</span></label><input class="input" id="vf_marca" name="marca" required maxlength="40" placeholder="Toyota" value="' + esc(v.marca || '') + '"></div>' +
      '<div class="form-row"><label for="vf_modelo">Modelo <span class="req">*</span></label><input class="input" id="vf_modelo" name="modelo" required maxlength="40" placeholder="Corolla" value="' + esc(v.modelo || '') + '"></div>' +
      '<div class="form-row"><label for="vf_color">Color</label><input class="input" id="vf_color" name="color" maxlength="25" placeholder="Blanco" value="' + esc(v.color || '') + '"></div>' +
      '<div class="form-row"><label for="vf_km">Kilometraje</label><input class="input" id="vf_km" name="km" type="number" min="0" step="1" placeholder="45000" value="' + esc(v.km || '') + '"></div>' +
      '<div class="form-row full"><label for="vf_cliente">Dueño <span class="req">*</span></label><select class="select" id="vf_cliente" name="clienteId" required>' +
      '<option value="" disabled ' + (!v.clienteId ? 'selected' : '') + '>Selecciona un cliente</option>' + options + '</select>' +
      (!D().clientes.length ? '<span class="hint">Primero debes registrar un cliente.</span>' : '') + '</div>' +
      '</div></form>';
  }

  function partRow(line, index) {
    const parts = D().repuestos;
    const selected = line || {};
    const exists = parts.some((p) => p.id === selected.repuestoId);
    const options = parts.map((p) => {
      const stockTxt = p.stock <= 0 ? ' · sin stock' : ' · stock ' + p.stock;
      return '<option value="' + p.id + '" data-price="' + p.precio + '" data-name="' + esc(p.nombre) + '" ' +
        (p.id === selected.repuestoId ? 'selected' : '') + '>' + esc(p.nombre) + ' — ' + fmt(p.precio) + stockTxt + '</option>';
    }).join('');
    const legacy = selected.repuestoId && !exists
      ? '<option value="' + esc(selected.repuestoId) + '" data-price="' + (selected.precio || 0) + '" data-name="' + esc(selected.nombre || '') + '" selected>' + esc(selected.nombre || 'Repuesto eliminado') + ' (histórico)</option>'
      : '';
    const qty = Number(selected.cantidad) || 1;
    const price = Number(selected.precio) || 0;
    return '<div class="part-row" data-part-row>' +
      '<select class="select" data-part-select aria-label="Repuesto">' +
      '<option value="" data-price="0" data-name="" ' + (!selected.repuestoId ? 'selected' : '') + '>Selecciona un repuesto…</option>' +
      options + legacy + '</select>' +
      '<input class="input" type="number" min="1" step="1" value="' + qty + '" data-part-qty aria-label="Cantidad" title="Cantidad">' +
      '<span class="part-line" data-part-line>' + fmt(price * qty) + '</span>' +
      '<button type="button" class="icon-btn sm danger" data-action="remove-part-row" aria-label="Quitar repuesto">' + icon('x') + '</button>' +
      '</div>';
  }

  function formOrden(order) {
    const o = order || {
      numero: S.nextOrderNumber(),
      vehiculoId: '',
      mecanico: '',
      fechaIngreso: AC.todayISO(),
      fechaEntrega: AC.addDaysISO(AC.todayISO(), 2),
      estado: 'Recibido',
      tipo: S.TIPOS[0],
      precioManoObra: '',
      observaciones: '',
      repuestosUsados: []
    };

    if (!D().vehiculos.length) {
      return '<div class="alert warning">' + icon('alert') +
        '<div><strong>No hay vehículos registrados</strong>Primero agrega un vehículo y asígnalo a un cliente para poder crear órdenes.</div></div>' +
        '<div class="modal-actions"><button class="btn btn-primary" data-action="new-vehicle">' + icon('plus') + 'Nuevo vehículo</button></div>';
    }

    const vehicleOptions = D().vehiculos.map((v) => {
      const owner = S.clienteNombre(v.clienteId);
      return '<option value="' + v.id + '" ' + (v.id === o.vehiculoId ? 'selected' : '') + '>' +
        esc(v.patente + ' · ' + v.marca + ' ' + v.modelo + ' — ' + owner) + '</option>';
    }).join('');

    const partsHtml = (o.repuestosUsados || []).length
      ? o.repuestosUsados.map((line, i) => partRow(line, i)).join('')
      : '<div class="part-empty" data-part-empty>Sin repuestos agregados. Usa el botón de abajo para sumar uno.</div>';

    return '<form id="formOrden" autocomplete="off">' +
      '<div class="form-grid">' +
      '<div class="form-row full"><label for="of_vehiculo">Vehículo <span class="req">*</span></label><select class="select" id="of_vehiculo" name="vehiculoId" required>' + vehicleOptions + '</select></div>' +
      '<div class="form-row"><label for="of_mecanico">Mecánico asignado</label><input class="input" id="of_mecanico" name="mecanico" maxlength="60" placeholder="Nombre del mecánico" value="' + esc(o.mecanico || '') + '"></div>' +
      '<div class="form-row"><label for="of_tipo">Tipo de reparación</label><select class="select" id="of_tipo" name="tipo">' +
      S.TIPOS.map((t) => '<option ' + (t === o.tipo ? 'selected' : '') + '>' + esc(t) + '</option>').join('') + '</select></div>' +
      '<div class="form-row"><label for="of_fingreso">Fecha de ingreso <span class="req">*</span></label><input class="input" id="of_fingreso" name="fechaIngreso" type="date" required value="' + esc(o.fechaIngreso || '') + '"></div>' +
      '<div class="form-row"><label for="of_fentrega">Entrega estimada</label><input class="input" id="of_fentrega" name="fechaEntrega" type="date" value="' + esc(o.fechaEntrega || '') + '"></div>' +
      '<div class="form-row"><label for="of_estado">Estado</label><select class="select" id="of_estado" name="estado">' +
      S.ESTADOS.map((e) => '<option ' + (e === o.estado ? 'selected' : '') + '>' + esc(e) + '</option>').join('') + '</select></div>' +
      '<div class="form-row"><label for="of_precio">Mano de obra (neto)</label><input class="input" id="of_precio" name="precioManoObra" type="number" min="0" step="1000" placeholder="0" value="' + esc(o.precioManoObra || '') + '"></div>' +
      '<div class="form-row full"><label>Repuestos utilizados</label>' +
      '<div class="parts-list" id="partsList">' + partsHtml + '</div>' +
      '<div class="mt-12"><button type="button" class="btn btn-sm btn-ghost" data-action="add-part-row" ' + (D().repuestos.length ? '' : 'disabled') + '>' + icon('plus') + 'Agregar repuesto</button>' +
      (!D().repuestos.length ? '<span class="hint" style="margin-left:8px">No hay repuestos en el inventario.</span>' : '') + '</div>' +
      '</div>' +
      '<div class="form-row full"><label for="of_obs">Observaciones</label><textarea class="textarea" id="of_obs" name="observaciones" rows="2" maxlength="500" placeholder="Detalles del trabajo, diagnóstico o acuerdos con el cliente…">' + esc(o.observaciones || '') + '</textarea></div>' +
      '<div class="form-row full">' +
      '<div class="total-box">' +
      '<div class="total-line"><span>Mano de obra</span><strong data-sum-labor>' + fmt(Number(o.precioManoObra) || 0) + '</strong></div>' +
      '<div class="total-line"><span>Repuestos</span><strong data-sum-parts>' + fmt(S.orderPartsTotal(o)) + '</strong></div>' +
      '<div class="total-line"><span>Neto</span><strong data-sum-neto>' + fmt(S.orderNeto(o)) + '</strong></div>' +
      '<div class="total-line"><span>IVA (19%)</span><strong data-sum-iva>' + fmt(Math.round(S.orderNeto(o) * 0.19)) + '</strong></div>' +
      '<div class="total-line grand"><span>Total</span><strong data-sum-total>' + fmt(S.orderTotal(o)) + '</strong></div>' +
      '</div></div>' +
      '</div></form>';
  }

  function formRepuesto(part) {
    const r = part || {};
    return '<form id="formRepuesto" autocomplete="off">' +
      '<div class="form-grid">' +
      '<div class="form-row full"><label for="rf_nombre">Nombre del repuesto <span class="req">*</span></label><input class="input" id="rf_nombre" name="nombre" required maxlength="80" placeholder="Ej: Pastillas de freno" value="' + esc(r.nombre || '') + '" data-autofocus></div>' +
      '<div class="form-row"><label for="rf_stock">Stock actual</label><input class="input" id="rf_stock" name="stock" type="number" min="0" step="1" value="' + esc(r.stock === undefined ? '' : r.stock) + '"></div>' +
      '<div class="form-row"><label for="rf_min">Stock mínimo</label><input class="input" id="rf_min" name="stockMin" type="number" min="0" step="1" value="' + esc(r.stockMin === undefined ? 5 : r.stockMin) + '"></div>' +
      '<div class="form-row"><label for="rf_precio">Precio unitario</label><input class="input" id="rf_precio" name="precio" type="number" min="0" step="100" placeholder="0" value="' + esc(r.precio === undefined ? '' : r.precio) + '"></div>' +
      '<div class="form-row"><label for="rf_proveedor">Proveedor</label><input class="input" id="rf_proveedor" name="proveedor" maxlength="60" placeholder="Proveedor" value="' + esc(r.proveedor || '') + '"></div>' +
      '</div></form>';
  }

  /* ==================== Fichas / detalles ==================== */
  function fichaCliente(id) {
    const c = S.get('clientes', id);
    if (!c) return null;
    const stats = S.clienteStats(id);
    const vehicles = S.clienteVehiculos(id);
    const orders = S.clienteOrdenes(id).sort((a, b) => String(b.fechaIngreso).localeCompare(String(a.fechaIngreso)));

    const body = '<div class="detail-head">' +
      AC.avatar(c.nombre) +
      '<div><div class="detail-title">' + esc(c.nombre) + '</div>' +
      '<div class="detail-sub">' + esc(c.rut || 'Sin RUT') + ' · Cliente desde ' + AC.fmtDate((c.creado || '').slice(0, 10)) + '</div></div>' +
      '<div class="detail-actions">' +
      '<button class="btn btn-sm btn-ghost" data-action="new-order" data-client="' + c.id + '">' + icon('plus') + 'Nueva orden</button>' +
      '<button class="btn btn-sm btn-primary" data-action="edit-client" data-id="' + c.id + '">' + icon('edit') + 'Editar</button>' +
      '</div></div>' +

      '<div class="info-grid mb-16">' +
      '<div class="info-item"><div class="k">Teléfono</div><div class="v">' + esc(c.telefono || '—') + '</div></div>' +
      '<div class="info-item"><div class="k">Correo</div><div class="v">' + esc(c.correo || '—') + '</div></div>' +
      '<div class="info-item"><div class="k">Dirección</div><div class="v">' + esc(c.direccion || '—') + '</div></div>' +
      '<div class="info-item"><div class="k">Vehículos</div><div class="v">' + stats.vehiculos + '</div></div>' +
      '<div class="info-item"><div class="k">Órdenes</div><div class="v">' + stats.ordenes + '</div></div>' +
      '<div class="info-item"><div class="k">Gasto total</div><div class="v">' + fmt(stats.gasto) + '</div></div>' +
      '</div>' +

      '<h3 style="font-size:13px;font-weight:700;margin:18px 0 8px">Vehículos registrados</h3>' +
      (vehicles.length
        ? '<div class="list">' + vehicles.map((v) =>
          '<div class="list-item"><span class="plate">' + esc(v.patente) + '</span>' +
          '<div class="grow"><div class="t">' + esc(v.marca + ' ' + v.modelo) + '</div><div class="s">' + esc((v.anio || '—') + ' · ' + fmtNum(v.km) + ' km') + '</div></div>' +
          '<button class="icon-btn sm" data-action="view-vehicle" data-id="' + v.id + '" aria-label="Ver ficha">' + icon('eye') + '</button></div>').join('') + '</div>'
        : '<p class="cell-sub">Sin vehículos registrados.</p>') +

      '<h3 style="font-size:13px;font-weight:700;margin:18px 0 8px">Historial de órdenes</h3>' +
      (orders.length
        ? '<div class="table-wrap"><table class="table"><thead><tr><th>Orden</th><th>Fecha</th><th>Servicio</th><th>Estado</th><th class="num">Total</th><th></th></tr></thead><tbody>' +
        orders.map((o) => '<tr><td data-label="Orden"><strong>#' + esc(o.numero) + '</strong></td>' +
          '<td data-label="Fecha">' + AC.fmtDateShort(o.fechaIngreso) + '</td>' +
          '<td data-label="Servicio">' + esc(o.tipo) + '</td>' +
          '<td data-label="Estado">' + estadoBadge(o.estado) + '</td>' +
          '<td data-label="Total" class="num">' + fmt(S.orderTotal(o)) + '</td>' +
          '<td class="actions" data-label=""><button class="icon-btn sm" data-action="view-order" data-id="' + o.id + '" aria-label="Ver orden">' + icon('eye') + '</button></td></tr>').join('') +
        '</tbody></table></div>'
        : '<p class="cell-sub">Sin órdenes registradas.</p>');

    return {
      title: 'Ficha del cliente',
      size: 'lg',
      body: body,
      footer: '<button class="btn btn-ghost" data-action="close-modal">Cerrar</button>'
    };
  }

  function fichaVehiculo(id) {
    const v = S.get('vehiculos', id);
    if (!v) return null;
    const orders = S.vehiculoOrdenes(id);
    const last = orders[orders.length - 1] || null;
    const maint = S.maintenanceInfo(v);
    const total = orders.reduce((acc, o) => acc + S.orderTotal(o), 0);
    const owner = S.get('clientes', v.clienteId);

    let timeline = '';
    if (last) {
      timeline = timelineHTML(last.estado);
    }

    const body = '<div class="detail-head">' +
      '<span class="avatar" style="--av:215">' + icon('car') + '</span>' +
      '<div><div class="detail-title">' + esc(v.patente) + ' · ' + esc(v.marca + ' ' + v.modelo) + '</div>' +
      '<div class="detail-sub">' + esc((v.anio || '—') + ' · ' + (v.color || 'Sin color') + ' · ' + fmtNum(v.km) + ' km') + '</div></div>' +
      '<div class="detail-actions">' +
      '<button class="btn btn-sm btn-ghost" data-action="new-order" data-vehicle="' + v.id + '">' + icon('plus') + 'Nueva orden</button>' +
      '<button class="btn btn-sm btn-primary" data-action="edit-vehicle" data-id="' + v.id + '">' + icon('edit') + 'Editar</button>' +
      '</div></div>' +

      (maint.due
        ? '<div class="alert warning mb-16">' + icon('alert') + '<div><strong>Mantención preventiva pendiente</strong>' +
        (maint.remaining === 0 ? 'El cambio de aceite está vencido según el kilometraje.' : 'Faltan ' + fmtNum(maint.remaining) + ' km para el próximo cambio de aceite.') +
        ' Próximo servicio sugerido: ' + fmtNum(maint.nextKm) + ' km.</div></div>'
        : '') +

      '<div class="info-grid mb-16">' +
      '<div class="info-item"><div class="k">Propietario</div><div class="v">' + esc(owner ? owner.nombre : '—') + '</div></div>' +
      '<div class="info-item"><div class="k">Teléfono</div><div class="v">' + esc(owner ? owner.telefono || '—' : '—') + '</div></div>' +
      '<div class="info-item"><div class="k">Servicios</div><div class="v">' + orders.length + '</div></div>' +
      '<div class="info-item"><div class="k">Costo acumulado</div><div class="v">' + fmt(total) + '</div></div>' +
      '</div>' +

      (last ? '<h3 style="font-size:13px;font-weight:700;margin:18px 0 6px">Estado de la última orden</h3>' +
        '<div class="cell-sub" style="margin-bottom:4px">#' + esc(last.numero) + ' · ' + esc(last.tipo) + ' · ' + AC.fmtDate(last.fechaIngreso) + '</div>' + timeline : '') +

      '<h3 style="font-size:13px;font-weight:700;margin:18px 0 8px">Historial de servicios</h3>' +
      (orders.length
        ? '<div class="table-wrap"><table class="table"><thead><tr><th>Fecha</th><th>Servicio</th><th>Mecánico</th><th>Estado</th><th class="num">Total</th><th></th></tr></thead><tbody>' +
        orders.slice().reverse().map((o) => '<tr><td data-label="Fecha">' + AC.fmtDateShort(o.fechaIngreso) + '</td>' +
          '<td data-label="Servicio">' + esc(o.tipo) + '</td>' +
          '<td data-label="Mecánico">' + esc(o.mecanico || '—') + '</td>' +
          '<td data-label="Estado">' + estadoBadge(o.estado) + '</td>' +
          '<td data-label="Total" class="num">' + fmt(S.orderTotal(o)) + '</td>' +
          '<td class="actions" data-label=""><button class="icon-btn sm" data-action="view-order" data-id="' + o.id + '" aria-label="Ver orden">' + icon('eye') + '</button></td></tr>').join('') +
        '</tbody></table></div>'
        : emptyState('wrench', 'Sin historial', 'Este vehículo todavía no tiene órdenes de trabajo.'));

    return {
      title: 'Ficha del vehículo',
      size: 'lg',
      body: body,
      footer: '<button class="btn btn-ghost" data-action="close-modal">Cerrar</button>' +
        (last ? '<button class="btn btn-ghost" data-action="invoice-order" data-id="' + last.id + '">' + icon('print') + 'Factura última orden</button>' : '')
    };
  }

  function detalleOrden(id) {
    const o = S.get('ordenes', id);
    if (!o) return null;
    const v = S.vehiculoById(o.vehiculoId);
    const timeline = timelineHTML(o.estado);

    const parts = o.repuestosUsados || [];
    const next = S.nextEstado(o.estado);

    const body = '<div class="detail-head">' +
      '<div><div class="detail-title">Orden #' + esc(o.numero) + '</div>' +
      '<div class="detail-sub">' + esc(o.tipo) + ' · ' + esc(S.clienteNombre(o.clienteId)) + '</div></div>' +
      '<div style="margin-left:auto">' + estadoBadge(o.estado) + '</div></div>' +

      timeline +

      '<div class="info-grid mb-16">' +
      '<div class="info-item"><div class="k">Vehículo</div><div class="v">' + esc(v ? v.patente + ' · ' + v.marca + ' ' + v.modelo : '—') + '</div></div>' +
      '<div class="info-item"><div class="k">Mecánico</div><div class="v">' + esc(o.mecanico || '—') + '</div></div>' +
      '<div class="info-item"><div class="k">Ingreso</div><div class="v">' + AC.fmtDate(o.fechaIngreso) + '</div></div>' +
      '<div class="info-item"><div class="k">Entrega estimada</div><div class="v">' + AC.fmtDate(o.fechaEntrega) + '</div></div>' +
      '</div>' +

      (o.observaciones ? '<div class="alert info mb-16">' + icon('info') + '<div><strong>Observaciones</strong>' + esc(o.observaciones) + '</div></div>' : '') +

      '<div class="table-wrap"><table class="table"><thead><tr><th>Concepto</th><th class="num">Monto</th></tr></thead><tbody>' +
      '<tr><td data-label="Concepto">Mano de obra</td><td data-label="Monto" class="num">' + fmt(o.precioManoObra) + '</td></tr>' +
      (parts.length ? parts.map((r) => '<tr><td data-label="Concepto">' + esc(r.nombre) + ' <span class="cell-sub">×' + esc(r.cantidad) + '</span></td><td data-label="Monto" class="num">' + fmt(Number(r.precio) * Number(r.cantidad)) + '</td></tr>').join('') : '') +
      '<tr><td data-label="Concepto">Neto</td><td data-label="Monto" class="num">' + fmt(S.orderNeto(o)) + '</td></tr>' +
      '<tr><td data-label="Concepto">IVA (19%)</td><td data-label="Monto" class="num">' + fmt(Math.round(S.orderNeto(o) * 0.19)) + '</td></tr>' +
      '<tr><td data-label="Concepto"><strong>Total</strong></td><td data-label="Monto" class="num"><strong>' + fmt(S.orderTotal(o)) + '</strong></td></tr>' +
      '</tbody></table></div>';

    return {
      title: 'Detalle de la orden',
      size: 'lg',
      body: body,
      footer: (next ? '<button class="btn btn-ghost" data-action="advance-order" data-id="' + o.id + '">' + icon('arrow-right') + 'Avanzar a ' + esc(next) + '</button>' : '') +
        '<button class="btn btn-ghost" data-action="invoice-order" data-id="' + o.id + '">' + icon('print') + 'Factura</button>' +
        '<button class="btn btn-primary" data-action="edit-order" data-id="' + o.id + '">' + icon('edit') + 'Editar</button>' +
        '<button class="btn btn-ghost" data-action="close-modal">Cerrar</button>'
    };
  }

  /* ==================== Documentos imprimibles ==================== */
  const docHeader = (kind, order, extra) =>
    '<div class="doc-head">' +
    '<div class="doc-brand"><span class="doc-brand-mark">' + icon('car') + '</span>' +
    '<div><strong>AutoCare</strong><small>Servicio automotriz · Gestión de taller</small></div></div>' +
    '<div class="doc-meta"><strong>' + esc(kind) + '</strong>N° ' + esc(order.numero) + '<br>' + esc(extra || '') + '</div>' +
    '</div>';

  function docFactura(id) {
    const o = S.get('ordenes', id);
    if (!o) return '';
    const v = S.vehiculoById(o.vehiculoId);
    const client = S.get('clientes', o.clienteId);
    const parts = o.repuestosUsados || [];
    const neto = S.orderNeto(o);
    const iva = Math.round(neto * 0.19);
    const total = neto + iva;
    const date = o.fechaEntrega || o.fechaIngreso;

    return '<div class="doc">' +
      docHeader('FACTURA', o, AC.fmtDate(date)) +
      '<div class="doc-parties">' +
      '<div class="doc-block"><div class="k">Cliente</div><div class="v">' + esc(client ? client.nombre : S.clienteNombre(o.clienteId)) + '</div>' +
      '<div class="s">' + esc(client ? client.rut || '' : '') + '</div>' +
      '<div class="s">' + esc(client ? client.telefono || '' : '') + '</div>' +
      '<div class="s">' + esc(client ? client.direccion || '' : '') + '</div></div>' +
      '<div class="doc-block"><div class="k">Vehículo</div><div class="v">' + esc(v ? v.patente + ' · ' + v.marca + ' ' + v.modelo : '—') + '</div>' +
      '<div class="s">Año ' + esc(v ? v.anio : '—') + ' · ' + esc(v ? fmtNum(v.km) + ' km' : '') + '</div>' +
      '<div class="s">Orden #' + esc(o.numero) + ' · ' + esc(o.tipo) + '</div>' +
      '<div class="s">Mecánico: ' + esc(o.mecanico || '—') + '</div></div>' +
      '</div>' +
      '<table><thead><tr><th>Concepto</th><th>Detalle</th><th class="num">Monto</th></tr></thead><tbody>' +
      '<tr><td>Mano de obra</td><td>' + esc(o.tipo) + '</td><td class="num">' + fmt(o.precioManoObra) + '</td></tr>' +
      (parts.length
        ? parts.map((r) => '<tr><td>Repuesto</td><td>' + esc(r.nombre) + ' × ' + esc(r.cantidad) + '</td><td class="num">' + fmt(Number(r.precio) * Number(r.cantidad)) + '</td></tr>').join('')
        : '<tr><td colspan="3" style="color:#82735e">Sin repuestos asociados</td></tr>') +
      '</tbody></table>' +
      '<div class="doc-totals">' +
      '<div class="doc-total-line"><span>Neto</span><span>' + fmt(neto) + '</span></div>' +
      '<div class="doc-total-line"><span>IVA (19%)</span><span>' + fmt(iva) + '</span></div>' +
      '<div class="doc-total-line grand"><span>Total</span><span>' + fmt(total) + '</span></div>' +
      '</div>' +
      '<div class="doc-foot"><span>Documento generado por AutoCare · ' + AC.fmtDate(AC.todayISO()) + '</span>' +
      '<span>Gracias por confiar en nosotros</span></div>' +
      '</div>';
  }

  function docOrden(id) {
    const o = S.get('ordenes', id);
    if (!o) return '';
    const v = S.vehiculoById(o.vehiculoId);
    const client = S.get('clientes', o.clienteId);
    const parts = o.repuestosUsados || [];

    return '<div class="doc">' +
      docHeader('ORDEN DE TRABAJO', o, AC.fmtDate(o.fechaIngreso)) +
      '<div class="doc-parties">' +
      '<div class="doc-block"><div class="k">Cliente</div><div class="v">' + esc(client ? client.nombre : S.clienteNombre(o.clienteId)) + '</div>' +
      '<div class="s">' + esc(client ? client.rut || '' : '') + ' · ' + esc(client ? client.telefono || '' : '') + '</div></div>' +
      '<div class="doc-block"><div class="k">Vehículo</div><div class="v">' + esc(v ? v.patente + ' · ' + v.marca + ' ' + v.modelo : '—') + '</div>' +
      '<div class="s">Año ' + esc(v ? v.anio : '—') + ' · ' + esc(v ? fmtNum(v.km) + ' km' : '') + '</div></div>' +
      '</div>' +
      '<table><tbody>' +
      '<tr><td style="width:35%"><strong>Estado</strong></td><td>' + esc(o.estado) + '</td></tr>' +
      '<tr><td><strong>Mecánico</strong></td><td>' + esc(o.mecanico || '—') + '</td></tr>' +
      '<tr><td><strong>Ingreso</strong></td><td>' + AC.fmtDate(o.fechaIngreso) + '</td></tr>' +
      '<tr><td><strong>Entrega estimada</strong></td><td>' + AC.fmtDate(o.fechaEntrega) + '</td></tr>' +
      '<tr><td><strong>Tipo de reparación</strong></td><td>' + esc(o.tipo) + '</td></tr>' +
      '<tr><td><strong>Repuestos</strong></td><td>' + (parts.length ? parts.map((r) => esc(r.nombre) + ' × ' + esc(r.cantidad)).join(', ') : 'Sin repuestos') + '</td></tr>' +
      '<tr><td><strong>Observaciones</strong></td><td>' + esc(o.observaciones || '—') + '</td></tr>' +
      '<tr><td><strong>Mano de obra</strong></td><td>' + fmt(o.precioManoObra) + '</td></tr>' +
      '<tr><td><strong>Total con IVA</strong></td><td><strong>' + fmt(S.orderTotal(o)) + '</strong></td></tr>' +
      '</tbody></table>' +
      '<div class="doc-foot" style="margin-top:50px;border-top:none">' +
      '<span>_____________________________<br>Firma cliente</span>' +
      '<span>_____________________________<br>Firma taller</span>' +
      '</div>' +
      '</div>';
  }

  /* ==================== API ==================== */
  AC.views = {
    dashboard: dashboard,
    clientes: clientes,
    vehiculos: vehiculos,
    ordenes: ordenes,
    repuestos: repuestos,

    rows: {
      clientes: clientesRows,
      vehiculos: vehiculosRows,
      ordenes: ordenesRows,
      repuestos: repuestosRows
    },

    forms: {
      cliente: formCliente,
      vehiculo: formVehiculo,
      orden: formOrden,
      repuesto: formRepuesto,
      partRow: partRow
    },

    fichaCliente: fichaCliente,
    fichaVehiculo: fichaVehiculo,
    detalleOrden: detalleOrden,
    docFactura: docFactura,
    docOrden: docOrden
  };
})(window.AC);
