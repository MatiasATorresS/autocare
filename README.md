# 🚗 AutoCare — Gestión de Taller Mecánico

Atender un taller mecánico implica llevar el rastro de muchísimas cosas: cada cliente, cada vehículo, cada reparación en curso, los repuestos que se gastan y los que hay que pedir. **AutoCare** es un pequeño sistema pensado exactamente para eso: organizar todo el día a día de un taller en una sola herramienta, sencilla de usar y sin necesidad de instalación.

Es una aplicación **100% frontend** que corre en el navegador. Está escrita en un único archivo HTML con **JavaScript puro** (sin frameworks, sin build), usa `localStorage` para guardar los datos y Chart.js para los gráficos. Al no depender de módulos ES, **puedes abrirla con doble clic** y funciona al instante.

## ✨ Qué hace

El taller se organiza en **8 secciones** accesibles desde el menú lateral:

- **📊 Dashboard** — El taller de un vistazo: vehículos ingresados hoy, clientes registrados, reparaciones activas, ingresos del mes y vehículos entregados. Con gráficos de ingresos de los últimos meses, reparaciones por tipo y vehículos por marca.
- **👤 Clientes** — Registro de clientes con su RUT, teléfono, correo y dirección, además de su gasto total acumulado en el taller.
- **🚘 Vehículos** — Cada vehículo con patente, marca, modelo, año, color, kilometraje y su dueño. Incluye una **ficha completa** con historial de servicios, timeline del estado actual y alerta de mantenimiento.
- **🔧 Órdenes de trabajo** — El corazón del sistema: órdenes con mecánico asignado, fechas de ingreso y entrega, tipo de reparación, mano de obra y estado. Cada orden genera su **factura** (con IVA 19% incluido) y se puede **imprimir**.
- **📦 Repuestos** — Inventario de repuestos con stock, precio y proveedor, con alerta visual ⚠ cuando el stock está bajo (menos de 5 unidades).
- **📅 Agenda** — Ingresos, entregas y avisos de mantenimiento ordenados por fecha, para saber qué se viene.
- **📈 Estadísticas** — Marcas más atendidas, ingresos por mes, reparaciones más frecuentes, tiempo promedio de reparación y ranking de clientes frecuentes.
- **🔍 Buscador** — Encuentra cualquier vehículo al instante por patente, cliente, marca o modelo.

### Flujo de una reparación

Cada orden recorre un **timeline de estados** bien claro: `Recibido → En diagnóstico → Esperando repuestos → En reparación → Listo → Entregado`. Así siempre sabes en qué punto está cada auto y qué falta para entregarlo.

## 🛠️ Stack

| Tecnología | Uso |
|---|---|
| HTML5 + CSS3 | Estructura y estilos (flexbox, grid, variables CSS) |
| JavaScript puro | Toda la lógica de la app |
| [Chart.js](https://www.chartjs.org/) | Gráficos del dashboard y estadísticas (vía CDN) |
| LocalStorage API | Persistencia de datos en el navegador |

Sin frameworks, sin dependencias de build, sin backend. Un solo archivo `.html` autocontenido (salvo Chart.js que se carga por CDN; si la abres sin internet, la app funciona pero sin gráficos).

## ▶️ Cómo ejecutarlo

Por ser un solo archivo sin módulos ES, **basta con hacer doble clic en `autocare.html`** y se abre en tu navegador. También puedes servirla con cualquier servidor estático si la prefieres:

```bash
python -m http.server 8000   # luego abre http://localhost:8000/autocare.html
```

Al abrirla por primera vez se cargan **datos de ejemplo** (2 clientes, 2 vehículos, 3 órdenes y 5 repuestos) para que veas el sistema funcionando con contenido real. Para limpiarlo todo y volver a empezar, abre la consola del navegador y ejecuta:

```js
localStorage.clear(); location.reload();
```

## 📁 Estructura

```
autocare/
└── autocare.html   # Toda la aplicación en un solo archivo (estilos, HTML y lógica)
```

Debido a su formato de un solo archivo, es muy fácil de transportar, compartir o adaptar: todo el sistema vive en un único `.html`.

## 🧠 Decisiones técnicas

- **Todo en un solo archivo** para máxima portabilidad: estilos, marcado y JavaScript conviven en `autocare.html`, simplificando su uso en cualquier máquina.
- **Repositorio en memoria + `localStorage`**: existe un objeto `DB` con clientes, vehículos, órdenes y repuestos que se serializa a `localStorage` (claves `ac_*`) tras cada operación.
- **Cálculo de totales con IVA chileno**: el total de cada orden suma mano de obra + repuestos y aplica 19% de IVA, con formato de moneda chilena (`$`, es-CL).
- **Alertas proactivas**: aviso de cambio de aceite según kilometraje (cada ~10.000 km) y de stock bajo de repuestos.
- **Casos de uso realistas**: los vehículos pertenecen a clientes, las órdenes se vinculan a un vehículo y cliente, y la agenda reúne todo en una sola línea de tiempo.

## 🚀 Posibles siguientes pasos

- Vincular repuestos reales a cada orden (hoy el consumo de repuestos se calcula pero no se registra su salida de stock).
- Impresión/formato PDF de fichas de vehículo, no solo de órdenes y facturas.
- Mover los datos a una base (SQLite/PostgreSQL + API) para uso multi-taller.
- Exportar respaldos JSON del inventario y los clientes.

---

Proyecto desarrollado por **Matías Torres Sandoval** como pieza de portafolio — Ingeniero Civil Informático (UNAB).
