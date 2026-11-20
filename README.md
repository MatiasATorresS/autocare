# 🚗 AutoCare — Gestión de Taller Mecánico

AutoCare es una aplicación **100% frontend** para administrar el día a día de un taller mecánico: clientes, vehículos, órdenes de trabajo y repuestos. Funciona sin backend, sin build y sin dependencias externas: **abre `index.html` con doble clic y listo**.

La versión 2 es una reconstrucción simple del sistema: cinco secciones claras, diseño responsive, gráficos propios en SVG (sin CDN), navegación por hash, formularios validados e impresión de facturas y órdenes.

---

## ✨ Funcionalidades

### Secciones

| Sección | Qué incluye |
|---|---|
| **Dashboard** | KPIs (ingresos del mes, órdenes activas, ticket promedio, stock en alerta), gráfico de ingresos de los últimos 6 meses, órdenes por estado y últimas órdenes. |
| **Órdenes de trabajo** | Listado filtrable por estado y buscable, creación/edición con repuestos, totales en vivo (neto + IVA 19%), avance de estado, factura imprimible y eliminación con devolución de stock. |
| **Clientes** | Directorio con RUT, contacto, dirección, cantidad de vehículos/órdenes y gasto acumulado. Ficha con historial. |
| **Vehículos** | Patente, marca, modelo, año, color, kilometraje y dueño. Ficha con historial de servicios y alerta de mantención cada 10.000 km. |
| **Repuestos** | Inventario con stock, stock mínimo, precio y proveedor. Ajuste rápido de stock con botones ± y barras visuales de nivel. |

### Extras

- **Atajo `N`** para crear una orden y `Esc` para cerrar diálogos.
- **Tema** claro u oscuro, recordado entre sesiones.
- **Responsive**: menú lateral en escritorio y drawer en móvil; las tablas se convierten en tarjetas en pantallas pequeñas.
- **Persistencia local** bajo `autocare.v2`, con migración automática desde los datos de la versión 1.
- **Datos de ejemplo** precargados la primera vez (6 clientes, 8 vehículos, 12 órdenes y 10 repuestos).

---

## 🛠️ Stack

| Tecnología | Uso |
|---|---|
| HTML5 semántico | Estructura de la aplicación y sprite de iconos SVG |
| CSS3 moderno | Variables, grid, flexbox, modo oscuro, print y responsive |
| JavaScript puro (ES5+/ES2017) | Lógica, ruteo, componentes y gráficos SVG propios |
| LocalStorage API | Persistencia sin servidor |

Sin frameworks, sin paquetes npm, sin CDN y sin backend. Todo funciona offline.

---

## ▶️ Cómo ejecutarlo

### Opción 1: doble clic

Abre **`index.html`** en tu navegador. No necesitas instalar nada ni iniciar un servidor.

> `autocare.html` queda como redirección para no romper enlaces antiguos.

### Opción 2: servidor local

```bash
python -m http.server 8000
```

Luego visita <http://localhost:8000/>.

---

## 📁 Estructura

```
autocare/
├── index.html               # Shell, sidebar, topbar, modales y sprite SVG
├── autocare.html            # Redirección al index (compatibilidad v1)
├── README.md
└── assets/
    ├── css/
    │   └── app.css          # Design system, componentes, responsive y print
    └── js/
        ├── core.js          # Helpers, tema, toasts, modales, impresión
        ├── store.js         # Persistencia, migración, CRUD, stock y métricas
        ├── charts.js        # Gráficos SVG (línea, barras, dona)
        ├── views.js         # Vistas, filas, formularios y documentos imprimibles
        └── app.js           # Ruteo, eventos y acciones
```

---

## 🧠 Decisiones técnicas

- **Identidad visual cálida de taller**: fondo papel crema, acentos óxido y grafito, bordes rectos y tipografía serif en títulos; evita el look genérico de panel SaaS.
- **Scripts clásicos en vez de módulos ES**: permite que `file://` funcione con doble clic, sin CORS ni servidor.
- **Gráficos SVG propios**: reemplazan a Chart.js para eliminar la dependencia de CDN y reducir peso; son ligeros, accesibles y respetan el tema.
- **Store centralizado**: `AC.store` expone CRUD, cálculo de totales, sincronización de stock y métricas. Cada mutación persiste y dispara un rerender de la vista activa.
- **Renderizado por vista con delegación de eventos**: un solo `data-action` en el DOM y un listener global; las búsquedas locales actualizan solo el `<tbody>`, sin redibujar toda la página.
- **Stock transaccional**: guardar, editar o eliminar una orden ajusta el inventario con las diferencias entre repuestos anteriores y nuevos.
- **Escaping de HTML**: todo dato del usuario se escapa antes de inyectarse en el DOM.
- **IVA chileno**: neto = mano de obra + repuestos; total = neto + 19%, formateado con `es-CL`.

---

## 🔄 Migración desde la versión 1

Si ya usabas AutoCare, los datos guardados en `ac_clientes`, `ac_vehiculos`, `ac_ordenes` y `ac_repuestos` se migran automáticamente a `autocare.v2` la primera vez que abres la nueva versión.

Para empezar de cero, borra la clave `autocare.v2` desde las herramientas de desarrollo del navegador (Application → Local Storage) y recarga la página.

---

Proyecto desarrollado por **Matías Torres Sandoval** como pieza de portafolio — Ingeniero Civil Informático (UNAB).
