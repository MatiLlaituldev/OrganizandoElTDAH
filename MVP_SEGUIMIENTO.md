# Plan de Seguimiento MVP - App TDAH (Entrega 17 de Mayo)

Este documento describe el alcance y las tareas principales para el Producto Mínimo Viable (MVP) de la aplicación de ayuda para el TDAH, con fecha objetivo de entrega el 17 de mayo.

## Requisitos Funcionales del MVP y Tareas Clave

A continuación, se detallan los 8 Requisitos Funcionales (RF) priorizados para este MVP y las tareas asociadas.

---

### 1. RF01: Registro de usuario
* **Descripción:** El usuario debe poder crear una cuenta mediante autenticación Firebase y almacenarse en la colección 'usuarios'.
* **Páginas/Componentes Involucrados:** `RegisterPage` (Página de Registro).
* **Funcionalidades Clave a Implementar:**
    * [ ] Diseño y maquetación del formulario de registro (nombre, email, contraseña).
    * [ ] Implementación de validaciones del formulario reactivo.
    * [ ] Lógica para llamar al servicio de autenticación (`AuthService`) para registrar al usuario en Firebase Authentication.
    * [ ] Lógica para actualizar el perfil de Firebase Auth con el `displayName`.
    * [ ] Lógica para crear el documento del usuario en la colección `usuarios` de Firestore con la información básica (uid, nombre, email, fechaCreacion).
    * [ ] Manejo de errores y feedback al usuario (ej. email ya en uso, contraseña débil).
    * [ ] Redirección a la página principal (ej. `/tabs/tasks`) tras un registro exitoso, esperando la confirmación del estado de autenticación.
* **Modelos de Datos Involucrados:** `Usuario` (ya definido).
* **Estado:** `Pendiente`

---

### 2. RF02: Inicio de sesión
* **Descripción:** El usuario debe poder iniciar sesión mediante Firebase Auth y acceder a sus datos personales desde su documento.
* **Páginas/Componentes Involucrados:** `LoginPage` (Página de Inicio de Sesión).
* **Funcionalidades Clave a Implementar:**
    * [ ] Diseño y maquetación del formulario de inicio de sesión (email, contraseña).
    * [ ] Implementación de validaciones del formulario reactivo.
    * [ ] Lógica para llamar al servicio de autenticación (`AuthService`) para iniciar sesión.
    * [ ] Manejo de errores y feedback al usuario (ej. credenciales incorrectas).
    * [ ] Redirección a la página principal (ej. `/tabs/tasks`) tras un inicio de sesión exitoso, esperando la confirmación del estado de autenticación.
* **Modelos de Datos Involucrados:** `Usuario`.
* **Estado:** `Pendiente`

---

### 3. RF03: Cierre de sesión
* **Descripción:** El usuario debe poder cerrar sesión de forma segura.
* **Páginas/Componentes Involucrados:** `ProfilePage` (Página de Perfil) o un menú global.
* **Funcionalidades Clave a Implementar:**
    * [ ] Botón o opción visible para "Cerrar Sesión".
    * [ ] Lógica para llamar al servicio de autenticación (`AuthService`) para cerrar la sesión.
    * [ ] Limpieza de cualquier estado de usuario local en la aplicación.
    * [ ] Redirección a la página de inicio de sesión (`/auth/login` o `/auth/welcome`).
* **Modelos de Datos Involucrados:** N/A (principalmente lógica de Auth).
* **Estado:** `Pendiente`

---

### 4. RF04: Gestión de tareas (Crear y Visualizar)
* **Descripción:** El usuario podrá crear y visualizar sus tareas. Marcar como completadas.
* **Páginas/Componentes Involucrados:** `TareasListPage`, `TareaFormComponent` (o modal).
* **Funcionalidades Clave a Implementar (MVP):**
    * [ ] UI para mostrar la lista de tareas del usuario (título, quizás fecha de vencimiento).
    * [ ] Botón o UI para iniciar la creación de una nueva tarea.
    * [ ] Formulario para crear una tarea (mínimo: título; opcional MVP: descripción, fecha de vencimiento).
    * [ ] Lógica para guardar la nueva tarea en la subcolección `tareas` del usuario en Firestore.
    * [ ] Lógica para permitir al usuario marcar/desmarcar una tarea como completada desde la lista.
    * [ ] Actualización visual inmediata del estado de la tarea en la lista.
* **Modelos de Datos Involucrados:** `Tarea`.
* **Estado:** `Pendiente`

---

### 5. RF12: Seguimiento de Tareas (Visualización Básica)
* **Descripción:** El sistema debe permitir visualizar las tareas completadas y sin completar.
* **Páginas/Componentes Involucrados:** `TareasListPage`.
* **Funcionalidades Clave a Implementar (MVP):**
    * [ ] En la lista de tareas, diferenciar visualmente las tareas completadas de las pendientes (ej. tachado, cambio de color, icono).
    * [ ] (Opcional MVP) Posibilidad de ordenar o agrupar tareas por estado (completadas arriba/abajo).
* **Modelos de Datos Involucrados:** `Tarea`.
* **Estado:** `Pendiente`

---

### 6. RF06: Gestión de hábitos (Crear y Visualizar)
* **Descripción:** El usuario podrá crear y visualizar hábitos personales.
* **Páginas/Componentes Involucrados:** `HabitosListPage`, `HabitoFormComponent` (o modal).
* **Funcionalidades Clave a Implementar (MVP):**
    * [ ] UI para mostrar la lista de hábitos del usuario (título, quizás frecuencia).
    * [ ] Botón o UI para iniciar la creación de un nuevo hábito.
    * [ ] Formulario para crear un hábito (mínimo: título, frecuenciaTipo; opcional MVP: icono, color).
    * [ ] Lógica para guardar el nuevo hábito en la subcolección `habitos` del usuario en Firestore.
* **Modelos de Datos Involucrados:** `Habito`.
* **Estado:** `Pendiente`

---

### 7. RF14: Seguimiento de hábitos (Registro de Cumplimiento)
* **Descripción:** El usuario podrá consultar el cumplimiento de sus hábitos, registrado en la subcolección `registrosHabitos`.
* **Páginas/Componentes Involucrados:** `HabitosListPage`.
* **Funcionalidades Clave a Implementar (MVP):**
    * [ ] En la lista de hábitos, permitir al usuario marcar un hábito como "hecho" para el día actual (ej. un checkbox o botón).
    * [ ] Al marcarlo, crear un nuevo documento en la subcolección `registrosHabitos` (con `habitoId`, `fecha` actual, `completado: true`, `timestampRegistro`).
    * [ ] (Opcional MVP) Mostrar la racha actual del hábito en la lista.
    * [ ] (Opcional MVP) Impedir marcar más de una vez por día o permitir "desmarcar".
* **Modelos de Datos Involucrados:** `Habito`, `RegistroHabito`.
* **Estado:** `Pendiente`

---

### 8. RF07: Registro de estado de ánimo y energía (Formulario Básico)
* **Descripción:** El usuario podrá registrar cómo se siente cada día.
* **Páginas/Componentes Involucrados:** `EstadoAnimoPage` (o modal).
* **Funcionalidades Clave a Implementar (MVP):**
    * [ ] UI con un formulario simple para que el usuario seleccione/ingrese su estado de ánimo y nivel de energía.
    * [ ] (Opcional MVP) Campo para notas adicionales.
    * [ ] Lógica para guardar el registro en la subcolección `estadosAnimoEnergia` del usuario en Firestore.
    * [ ] Botón para acceder a este formulario (ej. en un tab, menú o un botón flotante).
* **Modelos de Datos Involucrados:** `EstadoAnimoEnergia`.
* **Estado:** `Pendiente`

---

## Próximos Pasos y Consideraciones

* **Detallar Tareas:** Cada "Funcionalidad Clave a Implementar" puede desglosarse en tareas más pequeñas (ej. "Crear servicio TareaService con método addTarea()", "Diseñar componente card para Tarea").
* **Estimación de Esfuerzo:** Intentar estimar (aunque sea de forma general) el tiempo que podría llevar cada funcionalidad clave.
* **Priorización Interna:** Dentro de este MVP, si el tiempo apremia, identificar las sub-funcionalidades "opcionales MVP" que podrían recortarse.
* **Pruebas Continuas:** Realizar pruebas a medida que se completa cada funcionalidad.
* **Adaptación a Sprint:** Este listado puede servir como base para definir los User Stories y tareas de uno o varios sprints.

Este plan debería ayudarte a mantener el enfoque y a medir el progreso hacia tu entrega. ¡Mucho éxito!
