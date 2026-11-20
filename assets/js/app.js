/* ==========================================================================
   AutoCare v2 — Aplicación: ruteo, eventos y modales
   ========================================================================== */
(function (AC) {
  'use strict';

  const S = AC.store;
  const V = AC.views;
  const $ = AC.$;
  const $$ = AC.$$;
  const esc = AC.esc;
  const fmt = AC.fmt;
  const icon = AC.icon;

  const ROUTES = {
    dashboard: { title: 'Dashboard', sub: 'Resumen general del taller' },
    ordenes: { title: 'Órdenes de trabajo', sub: 'Control de reparaciones y entregas' },
    clientes: { title: 'Clientes', sub: 'Directorio de clientes del taller' },
    vehiculos: { title: 'Vehículos', sub: 'Flota registrada y su historial' },
    repuestos: { title: 'Repuestos', sub: 'Inventario y stock mínimo' }
  };

  const ESTADO_COLORS = {
    'Recibido': '#8a7a68',
    'En diagnóstico': '#c98a2e',
    'Esperando repuestos': '#a52a1f',
    'En reparación': '#b5461f',
    'Listo': '#5c7a3a',
    'Entregado': '#b3a793'
  };

  /* ==================== Ruteo ==================== */
  function currentRoute() {
    const raw = String(location.hash || '').replace(/^#\/?/, '').split('?')[0];
    return ROUTES[raw] ? raw : 'dashboard';
  }

  function navigate(route) {
    if (!ROUTES[route]) route = 'dashboard';
    if (currentRoute() === route) renderRoute();
    else location.hash = '#/' + route;
  }

  function renderRoute() {
    const route = currentRoute();
    const meta = ROUTES[route];
    const root = $('#viewRoot');

    root.innerHTML = V[route]();
    $('#pageTitle').textContent = meta.title;
    $('#pageSub').textContent = meta.sub;
    document.title = 'AutoCare · ' + meta.title;

    $$('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.route === route));
    updateNavCounts();
    mountCharts(route);

    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  function mountCharts(route) {
    if (route === 'dashboard') {
      const revenue = S.monthlyRevenue(6);
      if ($('#chRevenue')) {
        AC.charts.line($('#chRevenue'), {
          labels: revenue.map((r) => r.label),
          values: revenue.map((r) => r.total),
          money: true,
          ariaLabel: 'Ingresos de los últimos 6 meses'
        });
      }
      if ($('#chEstados')) {
        AC.charts.donut($('#chEstados'), {
          items: S.ordersByEstado()
            .filter((x) => x.value > 0)
            .map((x) => ({ label: x.label, value: x.value, color: ESTADO_COLORS[x.label] })),
          centerLabel: 'órdenes'
        });
      }
    }

  }

  function updateNavCounts() {
    const active = S.data.ordenes.filter((o) => o.estado !== 'Entregado').length;
    const count = $('#navOrdenesCount');
    if (count) {
      count.textContent = active;
      count.hidden = active === 0;
    }
    const dot = $('#navStockDot');
    if (dot) dot.hidden = S.lowStock().length === 0;

    const info = S.storageInfo();
    const total = S.data.clientes.length + S.data.vehiculos.length + S.data.ordenes.length + S.data.repuestos.length;
    const storage = $('#storageInfo');
    if (storage) storage.textContent = total + ' registros · ' + info.kb + ' KB';
  }

  /* ==================== Sidebar móvil ==================== */
  function openSidebar() {
    $('#sidebar').classList.add('open');
    $('#sidebarBackdrop').hidden = false;
  }
  function closeSidebar() {
    $('#sidebar').classList.remove('open');
    $('#sidebarBackdrop').hidden = true;
  }

  /* ==================== Modales: apertura ==================== */
  function openClienteModal(id) {
    const client = id ? S.get('clientes', id) : null;
    AC.openModal({
      title: (id ? 'Editar cliente' : 'Nuevo cliente'),
      body: V.forms.cliente(client),
      footer: '<button class="btn btn-ghost" data-action="close-modal">Cancelar</button>' +
        '<button class="btn btn-primary" type="submit" form="formCliente">' + icon('check') + (id ? 'Guardar cambios' : 'Crear cliente') + '</button>'
    });
    const form = $('#formCliente');
    if (form) form.dataset.id = id || '';
  }

  function openVehiculoModal(id) {
    if (!S.data.clientes.length) {
      AC.toast('Primero registra un cliente para poder agregar vehículos.', 'warning', 4200);
      openClienteModal();
      return;
    }
    const vehicle = id ? S.get('vehiculos', id) : null;
    AC.openModal({
      title: (id ? 'Editar vehículo' : 'Nuevo vehículo'),
      body: V.forms.vehiculo(vehicle),
      footer: '<button class="btn btn-ghost" data-action="close-modal">Cancelar</button>' +
        '<button class="btn btn-primary" type="submit" form="formVehiculo">' + icon('check') + (id ? 'Guardar cambios' : 'Crear vehículo') + '</button>'
    });
    const form = $('#formVehiculo');
    if (form) form.dataset.id = id || '';
  }

  function openRepuestoModal(id) {
    const part = id ? S.get('repuestos', id) : null;
    AC.openModal({
      title: (id ? 'Editar repuesto' : 'Nuevo repuesto'),
      body: V.forms.repuesto(part),
      footer: '<button class="btn btn-ghost" data-action="close-modal">Cancelar</button>' +
        '<button class="btn btn-primary" type="submit" form="formRepuesto">' + icon('check') + (id ? 'Guardar cambios' : 'Crear repuesto') + '</button>'
    });
    const form = $('#formRepuesto');
    if (form) form.dataset.id = id || '';
  }

  function openOrderModal(id, presetVehicleId) {
    const existing = id ? S.get('ordenes', id) : null;
    let base = existing;
    if (!existing && presetVehicleId && S.vehiculoById(presetVehicleId)) {
      base = {
        numero: S.nextOrderNumber(),
        vehiculoId: presetVehicleId,
        mecanico: '',
        fechaIngreso: AC.todayISO(),
        fechaEntrega: AC.addDaysISO(AC.todayISO(), 2),
        estado: 'Recibido',
        tipo: S.TIPOS[0],
        precioManoObra: '',
        observaciones: '',
        repuestosUsados: []
      };
    }
    const hasVehicles = S.data.vehiculos.length > 0;
    AC.openModal({
      title: existing ? 'Editar orden #' + existing.numero : 'Nueva orden de trabajo',
      size: 'lg',
      body: V.forms.orden(base),
      footer: '<button class="btn btn-ghost" data-action="close-modal">Cancelar</button>' +
        (hasVehicles ? '<button class="btn btn-primary" type="submit" form="formOrden">' + icon('check') + (existing ? 'Guardar cambios' : 'Crear orden') + '</button>' : '')
    });
    const form = $('#formOrden');
    if (form) form.dataset.id = id || '';
    recalcOrderTotals();
  }

  function openFichaCliente(id) {
    const data = V.fichaCliente(id);
    if (!data) return;
    AC.openModal({ title: data.title, body: data.body, footer: data.footer, size: data.size });
  }

  function openFichaVehiculo(id) {
    const data = V.fichaVehiculo(id);
    if (!data) return;
    AC.openModal({ title: data.title, body: data.body, footer: data.footer, size: data.size });
  }

  function openDetalleOrden(id) {
    const data = V.detalleOrden(id);
    if (!data) return;
    AC.openModal({ title: data.title, body: data.body, footer: data.footer, size: data.size });
  }

  function openFactura(id) {
    const order = S.get('ordenes', id);
    if (!order) return;
    AC.openModal({
      title: 'Factura · Orden #' + order.numero,
      size: 'lg',
      body: V.docFactura(id),
      footer: '<button class="btn btn-ghost" data-action="print-doc" data-mode="orden" data-id="' + id + '">' + icon('print') + 'Orden de trabajo</button>' +
        '<button class="btn btn-primary" data-action="print-doc" data-mode="factura" data-id="' + id + '">' + icon('print') + 'Imprimir factura</button>' +
        '<button class="btn btn-ghost" data-action="close-modal">Cerrar</button>'
    });
  }

  /* ==================== Órdenes: cálculo en vivo ==================== */
  function recalcOrderTotals() {
    const form = $('#formOrden');
    if (!form) return;
    const laborInput = $('#of_precio');
    const labor = laborInput ? Number(laborInput.value) || 0 : 0;
    let parts = 0;

    $$('#partsList [data-part-row]', form).forEach((row) => {
      const select = row.querySelector('[data-part-select]');
      const qtyInput = row.querySelector('[data-part-qty]');
      const qty = qtyInput ? Math.max(0, Number(qtyInput.value) || 0) : 0;
      const option = select && select.selectedIndex >= 0 ? select.options[select.selectedIndex] : null;
      const price = option ? Number(option.dataset.price) || 0 : 0;
      const line = price * qty;
      const lineEl = row.querySelector('[data-part-line]');
      if (lineEl) lineEl.textContent = fmt(line);
      if (select && select.value) parts += line;
    });

    const neto = labor + parts;
    const iva = Math.round(neto * 0.19);
    const total = neto + iva;
    const set = (selector, value) => {
      const el = form.querySelector(selector);
      if (el) el.textContent = value;
    };
    set('[data-sum-labor]', fmt(labor));
    set('[data-sum-parts]', fmt(parts));
    set('[data-sum-neto]', fmt(neto));
    set('[data-sum-iva]', fmt(iva));
    set('[data-sum-total]', fmt(total));
  }

  function addPartRow() {
    const list = $('#partsList');
    if (!list) return;
    const placeholder = list.querySelector('[data-part-empty]');
    if (placeholder) placeholder.remove();
    list.insertAdjacentHTML('beforeend', V.forms.partRow(null));
    recalcOrderTotals();
  }

  function removePartRow(button) {
    const row = button.closest('[data-part-row]');
    if (row) row.remove();
    const list = $('#partsList');
    if (list && !list.querySelector('[data-part-row]')) {
      list.innerHTML = '<div class="part-empty" data-part-empty>Sin repuestos agregados. Usa el botón de abajo para sumar uno.</div>';
    }
    recalcOrderTotals();
  }

  /* ==================== Guardar ==================== */
  function saveCliente(form) {
    const id = form.dataset.id || '';
    const d = AC.formData(form);
    if (!d.nombre) return AC.toast('El nombre es obligatorio.', 'error');

    const duplicate = S.data.clientes.find((c) =>
      c.id !== id && d.rut && c.rut && AC.normalize(c.rut) === AC.normalize(d.rut));
    if (duplicate) return AC.toast('Ya existe un cliente con el RUT ' + d.rut + '.', 'error');

    const payload = {
      nombre: d.nombre,
      rut: d.rut || '',
      telefono: d.telefono || '',
      correo: d.correo || '',
      direccion: d.direccion || ''
    };

    if (id) S.update('clientes', id, payload);
    else S.create('clientes', payload);

    AC.closeModal();
    renderRoute();
    AC.toast(id ? 'Cliente actualizado.' : 'Cliente creado correctamente.');
  }

  function saveVehiculo(form) {
    const id = form.dataset.id || '';
    const d = AC.formData(form);
    const patente = String(d.patente || '').toUpperCase().replace(/\s+/g, '');
    if (!patente || !d.marca || !d.modelo) return AC.toast('Patente, marca y modelo son obligatorios.', 'error');
    if (!d.clienteId) return AC.toast('Selecciona el dueño del vehículo.', 'error');

    const duplicate = S.data.vehiculos.find((v) => v.id !== id && v.patente === patente);
    if (duplicate) return AC.toast('Ya existe un vehículo con la patente ' + patente + '.', 'error');

    const payload = {
      patente: patente,
      marca: d.marca,
      modelo: d.modelo,
      anio: d.anio ? Number(d.anio) : '',
      color: d.color || '',
      km: Math.max(0, Number(d.km) || 0),
      clienteId: d.clienteId
    };

    if (id) S.update('vehiculos', id, payload);
    else S.create('vehiculos', payload);

    AC.closeModal();
    renderRoute();
    AC.toast(id ? 'Vehículo actualizado.' : 'Vehículo creado correctamente.');
  }

  function saveRepuesto(form) {
    const id = form.dataset.id || '';
    const d = AC.formData(form);
    if (!d.nombre) return AC.toast('El nombre del repuesto es obligatorio.', 'error');

    const payload = {
      nombre: d.nombre,
      stock: Math.max(0, Number(d.stock) || 0),
      stockMin: Math.max(0, Number(d.stockMin) || 0),
      precio: Math.max(0, Number(d.precio) || 0),
      proveedor: d.proveedor || ''
    };

    if (id) S.update('repuestos', id, payload);
    else S.create('repuestos', payload);

    AC.closeModal();
    renderRoute();
    AC.toast(id ? 'Repuesto actualizado.' : 'Repuesto agregado al inventario.');
  }

  function collectOrderParts() {
    const rows = $$('#partsList [data-part-row]');
    const map = {};
    rows.forEach((row) => {
      const select = row.querySelector('[data-part-select]');
      const qtyInput = row.querySelector('[data-part-qty]');
      if (!select || !select.value) return;
      const qty = Math.max(0, Number(qtyInput ? qtyInput.value : 1) || 0);
      if (!qty) return;
      const option = select.options[select.selectedIndex];
      const price = option ? Number(option.dataset.price) || 0 : 0;
      const name = option && option.dataset.name ? option.dataset.name : String(option ? option.textContent : '').split(' — ')[0];
      if (map[select.value]) {
        map[select.value].cantidad += qty;
      } else {
        map[select.value] = { repuestoId: select.value, nombre: name, precio: price, cantidad: qty };
      }
    });
    return Object.keys(map).map((k) => map[k]);
  }

  function saveOrden(form) {
    const id = form.dataset.id || '';
    const d = AC.formData(form);
    const vehicle = S.vehiculoById(d.vehiculoId);
    if (!vehicle) return AC.toast('Selecciona un vehículo para la orden.', 'error');
    if (!d.fechaIngreso) return AC.toast('La fecha de ingreso es obligatoria.', 'error');

    const existing = id ? S.get('ordenes', id) : null;
    const previousParts = existing ? JSON.parse(JSON.stringify(existing.repuestosUsados || [])) : null;

    const payload = {
      numero: existing ? existing.numero : S.nextOrderNumber(),
      vehiculoId: vehicle.id,
      clienteId: vehicle.clienteId,
      mecanico: d.mecanico || '',
      fechaIngreso: d.fechaIngreso,
      fechaEntrega: d.fechaEntrega || '',
      estado: d.estado || 'Recibido',
      tipo: d.tipo || S.TIPOS[0],
      precioManoObra: Math.max(0, Number(d.precioManoObra) || 0),
      repuestosUsados: collectOrderParts(),
      observaciones: d.observaciones || ''
    };

    if (existing) S.update('ordenes', id, payload);
    else S.create('ordenes', payload);

    const warnings = S.syncOrderStock({ repuestosUsados: previousParts || [] }, payload);

    AC.closeModal();
    renderRoute();

    if (warnings.length) {
      const first = warnings[0];
      AC.toast('Stock bajo: ' + first.part.nombre + ' quedó en ' + first.part.stock + ' unidades.', 'warning', 5200);
    } else {
      AC.toast(existing ? 'Orden actualizada.' : 'Orden creada correctamente.');
    }
  }

  /* ==================== Eliminar / avanzar ==================== */
  async function deleteCliente(id) {
    const client = S.get('clientes', id);
    if (!client) return;
    const vehicles = S.clienteVehiculos(id);
    if (vehicles.length) {
      return AC.toast('No puedes eliminar a ' + client.nombre + ': tiene ' + vehicles.length + ' ' + AC.plural(vehicles.length, 'vehículo registrado', 'vehículos registrados') + '.', 'error', 5000);
    }
    const ok = await AC.confirm({
      title: 'Eliminar cliente',
      message: 'Se eliminará a <strong>' + esc(client.nombre) + '</strong> del directorio. Esta acción no se puede deshacer.',
      confirmText: 'Eliminar cliente'
    });
    if (!ok) return;
    S.remove('clientes', id);
    renderRoute();
    AC.toast('Cliente eliminado.');
  }

  async function deleteVehiculo(id) {
    const vehicle = S.get('vehiculos', id);
    if (!vehicle) return;
    const orders = S.vehiculoOrdenes(id);
    if (orders.length) {
      return AC.toast('No puedes eliminar ' + vehicle.patente + ': tiene ' + orders.length + ' ' + AC.plural(orders.length, 'orden asociada', 'órdenes asociadas') + '.', 'error', 5000);
    }
    const ok = await AC.confirm({
      title: 'Eliminar vehículo',
      message: 'Se eliminará el vehículo <strong>' + esc(vehicle.patente + ' · ' + vehicle.marca + ' ' + vehicle.modelo) + '</strong>. Esta acción no se puede deshacer.',
      confirmText: 'Eliminar vehículo'
    });
    if (!ok) return;
    S.remove('vehiculos', id);
    renderRoute();
    AC.toast('Vehículo eliminado.');
  }

  async function deleteRepuesto(id) {
    const part = S.get('repuestos', id);
    if (!part) return;
    const used = S.data.ordenes.some((o) => (o.repuestosUsados || []).some((r) => r.repuestoId === id));
    const ok = await AC.confirm({
      title: 'Eliminar repuesto',
      message: 'Se eliminará <strong>' + esc(part.nombre) + '</strong> del inventario.' +
        (used ? ' Las órdenes históricas conservarán el registro del repuesto utilizado.' : ''),
      confirmText: 'Eliminar repuesto'
    });
    if (!ok) return;
    S.remove('repuestos', id);
    renderRoute();
    AC.toast('Repuesto eliminado.');
  }

  async function deleteOrden(id) {
    const order = S.get('ordenes', id);
    if (!order) return;
    const hasParts = (order.repuestosUsados || []).length > 0;
    const ok = await AC.confirm({
      title: 'Eliminar orden #' + order.numero,
      message: 'Se eliminará la orden de trabajo de <strong>' + esc(S.clienteNombre(order.clienteId)) + '</strong>.' +
        (hasParts ? ' Los repuestos utilizados volverán al inventario.' : ''),
      confirmText: 'Eliminar orden'
    });
    if (!ok) return;
    S.syncOrderStock({ repuestosUsados: order.repuestosUsados || [] }, null);
    S.remove('ordenes', id);
    AC.closeModal();
    renderRoute();
    AC.toast('Orden eliminada y stock restaurado.');
  }

  function advanceOrder(id) {
    const order = S.get('ordenes', id);
    if (!order) return;
    const next = S.nextEstado(order.estado);
    if (!next) return AC.toast('Esta orden ya está entregada.', 'info');
    const patch = { estado: next };
    if (next === 'Entregado' && !order.fechaEntrega) patch.fechaEntrega = AC.todayISO();
    S.update('ordenes', id, patch);
    AC.closeModal();
    renderRoute();
    AC.toast('Orden #' + order.numero + ' pasó a “' + next + '”.');
  }

  /* ==================== Acciones ==================== */
  function handleAction(action, el) {
    const id = el.dataset.id;
    switch (action) {
      /* Navegación y layout */
      case 'nav': return navigate(el.dataset.route);
      case 'open-sidebar': return openSidebar();
      case 'close-sidebar': return closeSidebar();
      case 'toggle-theme': {
        const next = AC.cycleTheme();
        return AC.toast(next === 'system' ? 'Tema del sistema' : next === 'dark' ? 'Tema oscuro' : 'Tema claro', 'info', 1600);
      }
      case 'close-modal': return AC.closeModal();

      /* Crear */
      case 'new-client': return openClienteModal();
      case 'new-vehicle': return openVehiculoModal();
      case 'new-part': return openRepuestoModal();
      case 'new-order': {
        AC.closeModal();
        let preset = el.dataset.vehicle || '';
        if (!preset && el.dataset.client) {
          const vehicles = S.clienteVehiculos(el.dataset.client);
          if (!vehicles.length) return AC.toast('Ese cliente no tiene vehículos. Agrega uno primero.', 'warning', 4500);
          preset = vehicles[0].id;
        }
        return openOrderModal(null, preset);
      }

      /* Ver / editar */
      case 'view-client': return openFichaCliente(id);
      case 'edit-client': return openClienteModal(id);
      case 'view-vehicle': return openFichaVehiculo(id);
      case 'edit-vehicle': return openVehiculoModal(id);
      case 'view-order': return openDetalleOrden(id);
      case 'edit-order': return openOrderModal(id);
      case 'edit-part': return openRepuestoModal(id);
      case 'invoice-order': return openFactura(id);
      case 'print-doc': return AC.printHTML(el.dataset.mode === 'orden' ? V.docOrden(id) : V.docFactura(id));

      /* Eliminar */
      case 'delete-client': return deleteCliente(id);
      case 'delete-vehicle': return deleteVehiculo(id);
      case 'delete-order': return deleteOrden(id);
      case 'delete-part': return deleteRepuesto(id);

      /* Órdenes */
      case 'advance-order': return advanceOrder(id);
      case 'add-part-row': return addPartRow();
      case 'remove-part-row': return removePartRow(el);

      /* Stock */
      case 'stock-inc': {
        S.adjustPartStock(id, 1);
        return renderRoute();
      }
      case 'stock-dec': {
        S.adjustPartStock(id, -1);
        return renderRoute();
      }

      /* Filtros */
      case 'filter-estado':
        AC.ui.estado = el.dataset.estado;
        return renderRoute();

      default: return undefined;
    }
  }

  /* ==================== Eventos ==================== */
  document.addEventListener('click', (event) => {
    const actionEl = event.target.closest('[data-action]');
    if (actionEl) {
      const action = actionEl.dataset.action;
      /* Evitar que un botón dentro de un formulario lo envíe sin querer */
      if (action !== 'print-doc') event.preventDefault();
      handleAction(action, actionEl);
      return;
    }

    const navLink = event.target.closest('.nav-item');
    if (navLink) closeSidebar();
  });

  document.addEventListener('input', (event) => {
    const target = event.target;

    if (target.id === 'qClientes') {
      AC.ui.q.clientes = target.value;
      $('#clientesBody').innerHTML = V.rows.clientes();
      return;
    }
    if (target.id === 'qVehiculos') {
      AC.ui.q.vehiculos = target.value;
      $('#vehiculosBody').innerHTML = V.rows.vehiculos();
      return;
    }
    if (target.id === 'qOrdenes') {
      AC.ui.q.ordenes = target.value;
      $('#ordenesBody').innerHTML = V.rows.ordenes();
      return;
    }
    if (target.id === 'qRepuestos') {
      AC.ui.q.repuestos = target.value;
      $('#repuestosBody').innerHTML = V.rows.repuestos();
      return;
    }
    if (target.id === 'of_precio' || target.matches('[data-part-qty]') || target.matches('[data-part-select]')) {
      recalcOrderTotals();
    }
  });

  document.addEventListener('change', (event) => {
    if (event.target.matches('[data-part-select]')) recalcOrderTotals();
  });

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!form || !form.id) return;
    event.preventDefault();
    if (form.id === 'formCliente') return saveCliente(form);
    if (form.id === 'formVehiculo') return saveVehiculo(form);
    if (form.id === 'formRepuesto') return saveRepuesto(form);
    if (form.id === 'formOrden') return saveOrden(form);
  });

  document.addEventListener('keydown', (event) => {
    const key = event.key;
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement && document.activeElement.tagName) || '');

    if (key === 'Escape' && $('#sidebar').classList.contains('open')) {
      closeSidebar();
      return;
    }

    if (!typing && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const modalOpen = !$('#overlay').hidden;
      if (modalOpen) return;
      if (String(key).toLowerCase() === 'n') {
        event.preventDefault();
        openOrderModal();
      }
    }
  });

  window.addEventListener('hashchange', renderRoute);

  /* El enlace "saltar al contenido" no debe alterar la ruta del hash */
  const skipLink = $('#skipLink');
  if (skipLink) {
    skipLink.addEventListener('click', (event) => {
      event.preventDefault();
      const main = $('#viewRoot');
      if (main) main.focus();
    });
  }

  /* ==================== Arranque ==================== */
  S.load();
  AC.applyTheme(AC.getThemePref());
  const year = $('#yearNow');
  if (year) year.textContent = new Date().getFullYear();

  if (!location.hash) {
    history.replaceState(null, '', '#/dashboard');
  }
  renderRoute();

  /* Pequeña ayuda para depurar desde la consola */
  AC.app = { navigate: navigate, render: renderRoute, openOrderModal: openOrderModal };
})(window.AC);
