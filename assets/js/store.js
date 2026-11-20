/* ==========================================================================
   AutoCare v2 — Capa de datos
   - Persistencia en localStorage (clave autocare.v2)
   - Migración automática desde la versión 1 (claves ac_*)
   - Operaciones CRUD + cálculo de totales + control de stock
   ========================================================================== */
window.AC = window.AC || {};

(function (AC) {
  'use strict';

  const KEY = 'autocare.v2';
  const LEGACY_KEYS = {
    clientes: 'ac_clientes',
    vehiculos: 'ac_vehiculos',
    ordenes: 'ac_ordenes',
    repuestos: 'ac_repuestos'
  };
  const ESTADOS = ['Recibido', 'En diagnóstico', 'Esperando repuestos', 'En reparación', 'Listo', 'Entregado'];
  const TIPOS = ['Cambio de aceite', 'Frenos', 'Motor', 'Suspensión', 'Electricidad', 'Scanner', 'Neumáticos', 'Aire acondicionado'];
  const ESTADO_CLASS = {
    'Recibido': 'b-recibido',
    'En diagnóstico': 'b-diagnostico',
    'Esperando repuestos': 'b-repuestos',
    'En reparación': 'b-reparacion',
    'Listo': 'b-listo',
    'Entregado': 'b-entregado'
  };

  const emptyData = () => ({
    version: 2,
    clientes: [],
    vehiculos: [],
    ordenes: [],
    repuestos: [],
    meta: { creado: new Date().toISOString(), actualizado: new Date().toISOString() }
  });

  let data = emptyData();

  /* ---------- Persistencia ---------- */
  function save() {
    try {
      data.meta = data.meta || {};
      data.meta.actualizado = new Date().toISOString();
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      if (AC.toast) AC.toast('No se pudieron guardar los datos en este navegador.', 'error', 5000);
      return false;
    }
  }

  function safeParse(raw) {
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function normalizeData(raw) {
    const base = emptyData();
    if (!raw || typeof raw !== 'object') return base;
    ['clientes', 'vehiculos', 'ordenes', 'repuestos'].forEach((kind) => {
      base[kind] = Array.isArray(raw[kind]) ? raw[kind] : [];
    });
    base.meta = raw.meta && typeof raw.meta === 'object' ? raw.meta : base.meta;
    base.version = 2;
    base.clientes.forEach((c) => {
      if (!c.id) c.id = AC.uid('cli');
      if (!c.creado) c.creado = new Date().toISOString();
      c.nombre = c.nombre || 'Sin nombre';
    });
    base.vehiculos.forEach((v) => {
      if (!v.id) v.id = AC.uid('veh');
      if (!v.creado) v.creado = new Date().toISOString();
      v.km = Number(v.km) || 0;
      v.anio = Number(v.anio) || '';
      v.patente = String(v.patente || '').toUpperCase();
    });
    base.ordenes.forEach((o) => {
      if (!o.id) o.id = AC.uid('ord');
      o.numero = Number(o.numero) || 1000;
      o.precioManoObra = Number(o.precioManoObra) || 0;
      o.repuestosUsados = Array.isArray(o.repuestosUsados) ? o.repuestosUsados : [];
      o.repuestosUsados.forEach((r) => {
        r.cantidad = Number(r.cantidad) || 1;
        r.precio = Number(r.precio) || 0;
      });
      if (ESTADOS.indexOf(o.estado) === -1) o.estado = 'Recibido';
      if (!o.creado) o.creado = o.fechaIngreso || new Date().toISOString();
    });
    base.repuestos.forEach((r) => {
      if (!r.id) r.id = AC.uid('rep');
      r.stock = Number(r.stock) || 0;
      r.stockMin = Number(r.stockMin) || 5;
      r.precio = Number(r.precio) || 0;
      if (!r.creado) r.creado = new Date().toISOString();
    });
    return base;
  }

  function migrateLegacy() {
    const legacy = {};
    let found = false;
    Object.keys(LEGACY_KEYS).forEach((kind) => {
      const raw = localStorage.getItem(LEGACY_KEYS[kind]);
      const parsed = raw ? safeParse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) {
        legacy[kind] = parsed;
        found = true;
      }
    });
    return found ? normalizeData(legacy) : null;
  }

  /* ---------- Datos de ejemplo ---------- */
  function seed() {
    const now = new Date();
    const d = (offset) => AC.addDaysISO(AC.todayISO(), offset);
    const stamp = (offset) => {
      const x = new Date(now.getTime() - offset * 86400000);
      return x.toISOString();
    };
    const base = emptyData();

    const clientes = [
      { nombre: 'Juan Pérez', rut: '12.345.678-9', telefono: '+56 9 1234 5678', correo: 'juan.perez@correo.cl', direccion: 'Av. Providencia 1234, Providencia', creado: stamp(420) },
      { nombre: 'María González', rut: '15.678.234-1', telefono: '+56 9 8765 4321', correo: 'maria.gonzalez@correo.cl', direccion: 'Los Leones 456, Ñuñoa', creado: stamp(360) },
      { nombre: 'Cristóbal Rojas', rut: '18.432.109-K', telefono: '+56 9 5555 1212', correo: 'cristobal.rojas@correo.cl', direccion: 'Av. Vicuña Mackenna 890, La Florida', creado: stamp(300) },
      { nombre: 'Camila Fuentes', rut: '16.204.876-3', telefono: '+56 9 4444 7878', correo: 'camila.fuentes@correo.cl', direccion: 'El Bosque 210, Las Condes', creado: stamp(210) },
      { nombre: 'Diego Herrera', rut: '13.987.654-5', telefono: '+56 9 3333 9090', correo: 'diego.herrera@correo.cl', direccion: 'San Martín 77, Concepción', creado: stamp(150) },
      { nombre: 'Valentina Soto', rut: '19.876.543-2', telefono: '+56 9 2222 3434', correo: 'valentina.soto@correo.cl', direccion: 'Av. Alemania 1500, Temuco', creado: stamp(90) }
    ];
    clientes.forEach((c) => { c.id = AC.uid('cli'); base.clientes.push(c); });
    const [c1, c2, c3, c4, c5, c6] = base.clientes.map((c) => c.id);

    const vehiculos = [
      { patente: 'ABCD12', marca: 'Toyota', modelo: 'Corolla', anio: 2020, color: 'Blanco', km: 45200, clienteId: c1, creado: stamp(410) },
      { patente: 'XYZW98', marca: 'Hyundai', modelo: 'Tucson', anio: 2022, color: 'Gris', km: 18400, clienteId: c2, creado: stamp(350) },
      { patente: 'KLMN45', marca: 'Kia', modelo: 'Rio', anio: 2019, color: 'Rojo', km: 39800, clienteId: c3, creado: stamp(290) },
      { patente: 'PQRS78', marca: 'Chevrolet', modelo: 'Sail', anio: 2021, color: 'Azul', km: 32100, clienteId: c4, creado: stamp(200) },
      { patente: 'TUVW11', marca: 'Nissan', modelo: 'Qashqai', anio: 2023, color: 'Negro', km: 9800, clienteId: c5, creado: stamp(140) },
      { patente: 'HJKL22', marca: 'Suzuki', modelo: 'Swift', anio: 2018, color: 'Plata', km: 99600, clienteId: c6, creado: stamp(85) },
      { patente: 'BCDE33', marca: 'Ford', modelo: 'Ranger', anio: 2020, color: 'Blanco', km: 59900, clienteId: c2, creado: stamp(260) },
      { patente: 'FGHI44', marca: 'Mazda', modelo: 'CX-5', anio: 2022, color: 'Rojo', km: 27600, clienteId: c1, creado: stamp(60) }
    ];
    vehiculos.forEach((v) => { v.id = AC.uid('veh'); base.vehiculos.push(v); });
    const [v1, v2, v3, v4, v5, v6, v7, v8] = base.vehiculos.map((v) => v.id);

    const repuestos = [
      { nombre: 'Aceite 5W30 (litro)', stock: 32, stockMin: 10, precio: 8500, proveedor: 'Distribuidora Lubrisur', creado: stamp(400) },
      { nombre: 'Filtro de aceite', stock: 20, stockMin: 8, precio: 6500, proveedor: 'Distribuidora Lubrisur', creado: stamp(400) },
      { nombre: 'Pastillas de freno', stock: 4, stockMin: 6, precio: 22000, proveedor: 'Frenos Chile', creado: stamp(380) },
      { nombre: 'Batería 12V', stock: 6, stockMin: 4, precio: 65000, proveedor: 'Baterías Bosch', creado: stamp(330) },
      { nombre: 'Correa de distribución', stock: 9, stockMin: 5, precio: 35000, proveedor: 'Repuestos Central', creado: stamp(300) },
      { nombre: 'Amortiguador delantero', stock: 2, stockMin: 4, precio: 48000, proveedor: 'Suspensión Total', creado: stamp(250) },
      { nombre: 'Bujía de encendido', stock: 24, stockMin: 8, precio: 4500, proveedor: 'Repuestos Central', creado: stamp(220) },
      { nombre: 'Filtro de aire', stock: 11, stockMin: 6, precio: 9500, proveedor: 'Distribuidora Lubrisur', creado: stamp(180) },
      { nombre: 'Líquido de frenos', stock: 15, stockMin: 5, precio: 5500, proveedor: 'Frenos Chile', creado: stamp(120) },
      { nombre: 'Kit de embrague', stock: 0, stockMin: 2, precio: 145000, proveedor: 'Transmisiones del Sur', creado: stamp(70) }
    ];
    repuestos.forEach((r) => { r.id = AC.uid('rep'); base.repuestos.push(r); });
    const [rAceite, rFiltroAceite, rPastillas, rBateria, rCorrea, rAmortiguador, rBujia, rFiltroAire, rLiquido, rEmbrague] = base.repuestos;

    const part = (p, cantidad) => ({ repuestoId: p.id, nombre: p.nombre, precio: p.precio, cantidad: cantidad });
    const ordenes = [
      { numero: 1001, vehiculoId: v1, clienteId: c1, mecanico: 'Carlos Muñoz', fechaIngreso: d(-164), fechaEntrega: d(-163), estado: 'Entregado', tipo: 'Cambio de aceite', precioManoObra: 25000, repuestosUsados: [part(rAceite, 4), part(rFiltroAceite, 1)], observaciones: 'Mantención de 40.000 km. Se revisan niveles y frenos.' },
      { numero: 1002, vehiculoId: v3, clienteId: c3, mecanico: 'Pedro Silva', fechaIngreso: d(-126), fechaEntrega: d(-124), estado: 'Entregado', tipo: 'Frenos', precioManoObra: 40000, repuestosUsados: [part(rPastillas, 1), part(rLiquido, 1)], observaciones: 'Cambio de pastillas delanteras y purga de líquido.' },
      { numero: 1003, vehiculoId: v6, clienteId: c6, mecanico: 'Andrea Torres', fechaIngreso: d(-98), fechaEntrega: d(-96), estado: 'Entregado', tipo: 'Suspensión', precioManoObra: 55000, repuestosUsados: [part(rAmortiguador, 2)], observaciones: 'Reemplazo de amortiguadores delanteros.' },
      { numero: 1004, vehiculoId: v2, clienteId: c2, mecanico: 'Carlos Muñoz', fechaIngreso: d(-74), fechaEntrega: d(-74), estado: 'Entregado', tipo: 'Scanner', precioManoObra: 18000, repuestosUsados: [], observaciones: 'Diagnóstico computacional, sin fallas activas.' },
      { numero: 1005, vehiculoId: v7, clienteId: c2, mecanico: 'Pedro Silva', fechaIngreso: d(-52), fechaEntrega: d(-48), estado: 'Entregado', tipo: 'Motor', precioManoObra: 120000, repuestosUsados: [part(rCorrea, 1), part(rBujia, 4)], observaciones: 'Cambio de correa de distribución y bujías.' },
      { numero: 1006, vehiculoId: v4, clienteId: c4, mecanico: 'Andrea Torres', fechaIngreso: d(-31), fechaEntrega: d(-30), estado: 'Entregado', tipo: 'Electricidad', precioManoObra: 32000, repuestosUsados: [part(rBateria, 1)], observaciones: 'Batería descargada, se reemplaza por una nueva.' },
      { numero: 1007, vehiculoId: v5, clienteId: c5, mecanico: 'Carlos Muñoz', fechaIngreso: d(-9), fechaEntrega: d(-9), estado: 'Entregado', tipo: 'Cambio de aceite', precioManoObra: 25000, repuestosUsados: [part(rAceite, 4), part(rFiltroAceite, 1), part(rFiltroAire, 1)], observaciones: 'Mantención preventiva de 10.000 km.' },
      { numero: 1008, vehiculoId: v1, clienteId: c1, mecanico: 'Pedro Silva', fechaIngreso: d(-4), fechaEntrega: d(1), estado: 'Listo', tipo: 'Frenos', precioManoObra: 38000, repuestosUsados: [part(rPastillas, 1)], observaciones: 'Pastillas traseras nuevas. Listo para entrega.' },
      { numero: 1009, vehiculoId: v3, clienteId: c3, mecanico: 'Andrea Torres', fechaIngreso: d(-3), fechaEntrega: d(2), estado: 'En reparación', tipo: 'Motor', precioManoObra: 90000, repuestosUsados: [], observaciones: 'Ruido en la correa. Se desarma para inspección.' },
      { numero: 1010, vehiculoId: v6, clienteId: c6, mecanico: 'Carlos Muñoz', fechaIngreso: d(-2), fechaEntrega: d(3), estado: 'Esperando repuestos', tipo: 'Suspensión', precioManoObra: 45000, repuestosUsados: [part(rAmortiguador, 2)], observaciones: 'Amortiguadores pedidos a proveedor.' },
      { numero: 1011, vehiculoId: v4, clienteId: c4, mecanico: 'Pedro Silva', fechaIngreso: d(-1), fechaEntrega: d(1), estado: 'En diagnóstico', tipo: 'Electricidad', precioManoObra: 28000, repuestosUsados: [], observaciones: 'Falla intermitente en luces de freno.' },
      { numero: 1012, vehiculoId: v8, clienteId: c1, mecanico: 'Andrea Torres', fechaIngreso: d(0), fechaEntrega: d(2), estado: 'Recibido', tipo: 'Scanner', precioManoObra: 20000, repuestosUsados: [], observaciones: 'Testigo de motor encendido. Pendiente diagnóstico.' }
    ];
    ordenes.forEach((o, i) => {
      o.id = AC.uid('ord');
      o.creado = new Date(now.getTime() - (12 - i) * 3600000).toISOString();
      base.ordenes.push(o);
    });

    data = base;
    save();
    return data;
  }

  /* ---------- Carga ---------- */
  function load() {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = safeParse(raw);
      data = normalizeData(parsed);
      return data;
    }
    const legacy = migrateLegacy();
    if (legacy) {
      data = legacy;
      save();
      return data;
    }
    return seed();
  }

  /* ---------- CRUD ---------- */
  function get(kind, id) {
    return (data[kind] || []).find((item) => item.id === id) || null;
  }

  function create(kind, obj) {
    const prefixes = { clientes: 'cli', vehiculos: 'veh', ordenes: 'ord', repuestos: 'rep' };
    const item = Object.assign({}, obj, {
      id: obj.id || AC.uid(prefixes[kind] || 'id'),
      creado: obj.creado || new Date().toISOString()
    });
    data[kind].push(item);
    save();
    return item;
  }

  function update(kind, id, patch) {
    const item = get(kind, id);
    if (!item) return null;
    Object.assign(item, patch);
    save();
    return item;
  }

  function remove(kind, id) {
    const before = data[kind].length;
    data[kind] = data[kind].filter((item) => item.id !== id);
    save();
    return data[kind].length !== before;
  }

  /* ---------- Totales ---------- */
  function orderNeto(order) {
    if (!order) return 0;
    const labor = Number(order.precioManoObra) || 0;
    const parts = (order.repuestosUsados || []).reduce((acc, r) => acc + (Number(r.precio) || 0) * (Number(r.cantidad) || 0), 0);
    return labor + parts;
  }

  function orderTotal(order) {
    return Math.round(orderNeto(order) * 1.19);
  }

  function orderPartsTotal(order) {
    return (order ? order.repuestosUsados || [] : []).reduce((acc, r) => acc + (Number(r.precio) || 0) * (Number(r.cantidad) || 0), 0);
  }

  /* ---------- Stock ---------- */
  function stockStatus(part) {
    if (!part) return 'ok';
    if (Number(part.stock) <= 0) return 'critical';
    if (Number(part.stock) <= Number(part.stockMin || 5)) return 'low';
    return 'ok';
  }

  function lowStock() {
    return data.repuestos
      .filter((r) => stockStatus(r) !== 'ok')
      .sort((a, b) => (a.stock / Math.max(1, a.stockMin)) - (b.stock / Math.max(1, b.stockMin)));
  }

  /**
   * Ajusta el inventario al guardar una orden.
   * Devuelve las advertencias de stock (repuestos que quedaron bajo el mínimo o en cero).
   */
  function syncOrderStock(prevOrder, nextOrder) {
    const deltas = {};
    ((prevOrder && prevOrder.repuestosUsados) || []).forEach((r) => {
      if (!r.repuestoId) return;
      deltas[r.repuestoId] = (deltas[r.repuestoId] || 0) + (Number(r.cantidad) || 0);
    });
    ((nextOrder && nextOrder.repuestosUsados) || []).forEach((r) => {
      if (!r.repuestoId) return;
      deltas[r.repuestoId] = (deltas[r.repuestoId] || 0) - (Number(r.cantidad) || 0);
    });

    const warnings = [];
    Object.keys(deltas).forEach((partId) => {
      const delta = deltas[partId];
      if (!delta) return;
      const part = get('repuestos', partId);
      if (!part) return;
      const before = Number(part.stock) || 0;
      const after = Math.max(0, before + delta);
      part.stock = after;
      if (delta < 0 && after < before) {
        if (after <= 0) warnings.push({ part: part, level: 'critical' });
        else if (after <= Number(part.stockMin || 5)) warnings.push({ part: part, level: 'low' });
      }
    });
    if (Object.keys(deltas).length) save();
    return warnings;
  }

  function adjustPartStock(id, delta) {
    const part = get('repuestos', id);
    if (!part) return null;
    part.stock = Math.max(0, (Number(part.stock) || 0) + Number(delta || 0));
    save();
    return part;
  }

  function inventoryValue() {
    return data.repuestos.reduce((acc, r) => acc + (Number(r.precio) || 0) * (Number(r.stock) || 0), 0);
  }

  /* ---------- Búsquedas / etiquetas ---------- */
  const clienteNombre = (id) => {
    const c = get('clientes', id);
    return c ? c.nombre : 'Cliente eliminado';
  };

  const vehiculoById = (id) => get('vehiculos', id);

  const vehiculoLabel = (id) => {
    const v = vehiculoById(id);
    return v ? v.patente + ' · ' + v.marca + ' ' + v.modelo : 'Vehículo eliminado';
  };

  const vehiculoShort = (id) => {
    const v = vehiculoById(id);
    return v ? v.patente + ' ' + v.marca + ' ' + v.modelo : 'Vehículo eliminado';
  };

  const clienteVehiculos = (clienteId) => data.vehiculos.filter((v) => v.clienteId === clienteId);
  const clienteOrdenes = (clienteId) => data.ordenes.filter((o) => o.clienteId === clienteId);
  const vehiculoOrdenes = (vehiculoId) => data.ordenes
    .filter((o) => o.vehiculoId === vehiculoId)
    .sort((a, b) => String(a.fechaIngreso).localeCompare(String(b.fechaIngreso)));

  const clienteGasto = (clienteId) => clienteOrdenes(clienteId).reduce((acc, o) => acc + orderTotal(o), 0);
  const clienteStats = (clienteId) => ({
    vehiculos: clienteVehiculos(clienteId).length,
    ordenes: clienteOrdenes(clienteId).length,
    gasto: clienteGasto(clienteId),
    ultima: clienteOrdenes(clienteId).sort((a, b) => String(b.fechaIngreso).localeCompare(String(a.fechaIngreso)))[0] || null
  });

  const lastOrderOfVehicle = (vehiculoId) => {
    const list = vehiculoOrdenes(vehiculoId);
    return list[list.length - 1] || null;
  };

  const nextOrderNumber = () => {
    const max = data.ordenes.reduce((acc, o) => Math.max(acc, Number(o.numero) || 0), 1000);
    return max + 1;
  };

  const nextEstado = (estado) => {
    const idx = ESTADOS.indexOf(estado);
    if (idx === -1 || idx === ESTADOS.length - 1) return null;
    return ESTADOS[idx + 1];
  };

  /* ---------- Mantenimiento ---------- */
  function maintenanceInfo(vehicle) {
    const km = Number(vehicle && vehicle.km) || 0;
    const interval = 10000;
    const mod = km % interval;
    const remaining = mod === 0 ? interval : interval - mod;
    const nextKm = km + remaining;
    return {
      due: remaining <= 1500,
      remaining: remaining,
      nextKm: nextKm,
      km: km
    };
  }

  /* ---------- Estadísticas ---------- */
  function monthlyRevenue(months) {
    const count = months || 6;
    const out = [];
    const now = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = AC.monthKeyOf(d);
      const total = data.ordenes
        .filter((o) => o.estado === 'Entregado' && AC.monthKey(o.fechaEntrega || o.fechaIngreso) === key)
        .reduce((acc, o) => acc + orderTotal(o), 0);
      out.push({ key: key, label: AC.monthLabel(key), total: total });
    }
    return out;
  }

  function ordersByEstado() {
    return ESTADOS.map((estado) => ({
      label: estado,
      value: data.ordenes.filter((o) => o.estado === estado).length
    }));
  }

  function avgTicket() {
    const done = data.ordenes.filter((o) => o.estado === 'Entregado');
    if (!done.length) return 0;
    return done.reduce((acc, o) => acc + orderTotal(o), 0) / done.length;
  }

  function storageInfo() {
    try {
      const raw = localStorage.getItem(KEY) || '';
      const kb = Math.max(1, Math.round((raw.length * 2) / 1024));
      return { bytes: raw.length * 2, kb: kb, key: KEY };
    } catch (e) {
      return { bytes: 0, kb: 0, key: KEY };
    }
  }

  /* ---------- API pública ---------- */
  AC.store = {
    KEY: KEY,
    ESTADOS: ESTADOS,
    TIPOS: TIPOS,
    ESTADO_CLASS: ESTADO_CLASS,
    get data() { return data; },
    load: load,
    save: save,
    seed: seed,
    get: get,
    create: create,
    update: update,
    remove: remove,
    orderNeto: orderNeto,
    orderTotal: orderTotal,
    orderPartsTotal: orderPartsTotal,
    stockStatus: stockStatus,
    lowStock: lowStock,
    syncOrderStock: syncOrderStock,
    adjustPartStock: adjustPartStock,
    inventoryValue: inventoryValue,
    clienteNombre: clienteNombre,
    vehiculoById: vehiculoById,
    vehiculoLabel: vehiculoLabel,
    vehiculoShort: vehiculoShort,
    clienteVehiculos: clienteVehiculos,
    clienteOrdenes: clienteOrdenes,
    vehiculoOrdenes: vehiculoOrdenes,
    clienteGasto: clienteGasto,
    clienteStats: clienteStats,
    lastOrderOfVehicle: lastOrderOfVehicle,
    nextOrderNumber: nextOrderNumber,
    nextEstado: nextEstado,
    maintenanceInfo: maintenanceInfo,
    monthlyRevenue: monthlyRevenue,
    ordersByEstado: ordersByEstado,
    avgTicket: avgTicket,
    storageInfo: storageInfo
  };
})(window.AC);
