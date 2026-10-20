# ArquiFlow: brief para un nuevo diseño

## Qué es

ArquiFlow es una aplicación web para estudios de arquitectura y constructoras que gestionan obras **después de firmado el contrato**. Reúne en un solo lugar lo que hoy suele vivir en planillas, WhatsApp y carpetas de fotos:

- **Cronograma** de la obra (diagrama de Gantt).
- **Presupuesto vs. gasto real**, partida por partida.
- **Bitácora de obra** diaria con fotos.
- **Pagos a proveedores** y saldo pendiente con cada uno.
- **Reporte PDF** para entregar al cliente.

Idioma de la interfaz: español (Argentina). Moneda: pesos argentinos (ARS, formato `$ 1.234.567,89`). Fechas en formato `dd/mm/aaaa`.

## Quién la usa

| Rol | Quién es | Qué puede hacer |
|---|---|---|
| **Admin** | Dueño o responsable del estudio | Todo. Además gestiona usuarios y el maestro de tipos de tarea. |
| **Project Manager** | Arquitecto/a a cargo de una o varias obras | Crea y edita obras, presupuesto, cronograma, pagos, proveedores. Invita clientes. |
| **Supervisor** | Jefe/a de obra, está en el sitio | Ve la obra, carga entradas de bitácora con fotos y registra gastos con comprobante. No ve pagos. Uso principal **desde el celular, en obra**. |
| **Cliente** | Quien encargó la obra | Solo lectura de las obras a las que fue invitado: cronograma, presupuesto, bitácora. Descarga el reporte PDF. |

El diseño debe contemplar que la misma pantalla cambia según el rol (pestañas y botones que aparecen o no).

## Modelo de datos (lo que se muestra)

- **Obra**: nombre, dirección, descripción, fecha de inicio y fin, estado (`Planificación`, `En curso`, `En pausa`, `Completada`, `Cancelada`), presupuesto total.
- **Ítem de presupuesto** (partida): categoría, descripción, monto presupuestado, unidad y cantidad opcionales. Categorías: Materiales, Mano de obra, Equipos y herramientas, Subcontratos, Servicios profesionales, Imprevistos, Otros.
- **Gasto**: pertenece a un ítem de presupuesto. Monto, fecha, descripción, proveedor (opcional), comprobante adjunto (foto o PDF).
- **Tarea del cronograma**: nombre (elegido de un maestro de tipos de tarea), fecha de inicio y fin, % de avance, estado (`Sin iniciar`, `En curso`, `Terminada`, `Atrasada`), orden.
- **Entrada de bitácora**: fecha, clima, notas, autor, varias fotos con epígrafe opcional.
- **Proveedor**: nombre, contacto, teléfono, email, CUIT, rubro.
- **Pago**: obra, proveedor, monto, fecha, medio de pago (ej. transferencia), estado (`Pendiente` / `Pagado`), vínculo opcional a un gasto.
- **Usuario**: nombre completo, email, rol.
- **Tipo de tarea**: catálogo global de nombres de tareas (ej. "Excavación", "Losa", "Instalación eléctrica").

## Pantallas actuales

### 1. Login
Email y contraseña. Sin registro público: los usuarios los crea el Admin o llegan por invitación de cliente.

### 2. Layout general
Barra lateral con navegación (en celular se abre como panel desde un botón de menú). Encabezado con el nombre del usuario, selector de tema claro/oscuro y "Cerrar sesión".

Navegación según rol:
- **Obras** (todos)
- **Proveedores** (Admin, PM)
- **Usuarios** (Admin)
- **Maestro de tareas** (Admin)

### 3. Obras (listado)
Tabla con nombre, dirección, estado (badge) y presupuesto. Botón "Nueva obra" para Admin/PM. Estado vacío cuando no hay obras.

Oportunidad: hoy es solo una tabla. Un listado que muestre de un vistazo **avance del cronograma** y **% del presupuesto consumido** por obra sería mucho más útil.

### 4. Detalle de obra
Encabezado con los datos de la obra, acciones de editar y **descargar reporte PDF**. Debajo, pestañas:

**a. Cronograma**
- Diagrama de Gantt con las tareas, barras con % de avance.
- Arrastrar barras para cambiar fechas (Admin/PM).
- Botón "Nueva tarea": tipo de tarea, fecha de inicio, fecha de fin, avance, estado.

**b. Presupuesto**
- Resumen: Presupuestado total, Gastado total, Disponible.
- Gráfico "Presupuesto vs. gasto real" por categoría.
- Lista de ítems de presupuesto como tarjetas; cada una se expande y muestra sus gastos (fecha, descripción, monto, comprobante).
- "Agregar gasto" (Admin, PM, Supervisor): monto, fecha, descripción, proveedor, comprobante (foto o PDF).
- Un ítem pasado de presupuesto debe resaltarse.

**c. Bitácora**
- Línea de tiempo de entradas, la más reciente arriba. Cada entrada: fecha, autor, clima, notas y galería de fotos.
- "Nueva entrada" (Admin, PM, Supervisor): fecha, clima, notas, subir varias fotos. Este flujo se usa **en obra, desde el celular, con una mano**: tiene que ser rápido.

**d. Pagos** (Admin, PM)
- Tabla de pagos: proveedor, fecha, monto, medio, estado. Cambiar estado Pendiente ↔ Pagado.
- Resumen "Saldo por proveedor" (cuánto se le pagó y cuánto queda pendiente a cada uno).
- "Registrar pago": proveedor, monto, fecha, medio de pago, vínculo opcional a un gasto.

**e. Cliente** (Admin, PM)
- "Acceso del cliente": lista de clientes con acceso a esta obra.
- "Invitar cliente": nombre completo, email, contraseña. Quitar acceso.

### 5. Proveedores
Tabla con nombre, contacto, teléfono, email, CUIT, rubro. Crear, editar, eliminar.

### 6. Usuarios (Admin)
Tabla de usuarios con rol. Crear usuario: nombre, email, contraseña, rol.

### 7. Maestro de tareas (Admin)
Lista simple de tipos de tarea. Crear, editar, eliminar.

### 8. Reporte PDF (para el cliente)
Documento A4 generado en el servidor: encabezado con nombre de la obra, dirección, fechas y estado; sección "Presupuesto vs. gasto real" con totales y tabla por ítem (lo excedido en rojo); sección "Cronograma" con tabla de tareas (inicio, fin, avance, estado); sección de fotos recientes de la bitácora; pie con fecha de generación y número de página.

## Flujos clave a diseñar bien

1. **PM arma una obra nueva**: crea la obra → carga partidas de presupuesto → arma el cronograma → invita al cliente.
2. **Supervisor en obra** (celular): abre la obra → nueva entrada de bitácora con 3–5 fotos → registra un gasto sacándole foto a la factura.
3. **PM controla desvíos**: entra a una obra → ve de inmediato si va atrasada o pasada de presupuesto → baja al ítem o tarea culpable.
4. **PM paga a proveedores**: revisa saldo por proveedor → registra el pago → lo marca como pagado.
5. **Cliente consulta**: entra, ve el avance y las fotos, descarga el PDF. Nada de botones de edición.

## Lo que falta y el diseño puede proponer

- **Dashboard / inicio**: hoy no existe; al entrar se va directo al listado. Un resumen de todas las obras (atrasadas, pasadas de presupuesto, pagos pendientes, última actividad en bitácora) aportaría mucho al Admin y al PM.
- **Vista del cliente** más cuidada: hoy ve la misma pantalla que el equipo, con pestañas recortadas. Podría ser una vista tipo "portal" más visual y menos operativa.
- Indicadores de salud de la obra (semáforo de cronograma y presupuesto) visibles en el listado y en el encabezado del detalle.
- Edición de usuarios (hoy solo se crean) y edición de entradas de bitácora (hoy solo se crean y borran).

## Restricciones técnicas para que el diseño sea implementable

- Frontend: React + TypeScript, Tailwind CSS v4, componentes **shadcn/ui** (base-ui), íconos **lucide-react**, tipografía **Geist**.
- Gráficos con **Recharts**; Gantt con **gantt-task-react**.
- Tema **claro y oscuro** obligatorio.
- **Responsive real**: escritorio para PM/Admin, celular para Supervisor y Cliente.
- Formularios en diálogos (modales); confirmación antes de borrar; notificaciones tipo toast.
- Estados de carga, error y vacío en cada lista.
