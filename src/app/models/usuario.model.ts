// src/app/models/usuario.model.ts

// Importación del tipo Timestamp de Firestore.
// Asegúrate de que esta importación sea la correcta para tu versión de Firebase.
// Para Firebase v9+ modular, usualmente es:
import { Timestamp } from 'firebase/firestore';
// Si usas una versión anterior o compat, podría ser:
// import firebase from 'firebase/compat/app';
// type Timestamp = firebase.firestore.Timestamp;

// Interfaz para las configuraciones específicas del usuario.
// Estas son preferencias que el usuario podría ajustar en la aplicación.
export interface ConfiguracionesUsuario {
  notificacionesTareas?: boolean;     // ¿Recibir notificaciones para tareas?
  notificacionesHabitos?: boolean;    // ¿Recibir notificaciones para hábitos?
  temaOscuro?: boolean;               // ¿Usar el tema oscuro de la aplicación?
  // Puedes agregar aquí otras configuraciones personalizadas que necesites.
  // Ejemplo: sonidoNotificacion?: string;
}

// Interfaz principal para el documento de Usuario.
// Representa la estructura de los datos de un usuario en la colección 'usuarios' de Firestore.
export interface Usuario {
  uid: string;                        // Identificador único del usuario (de Firebase Authentication).
  nombre: string;                     // Nombre completo del usuario.
  email: string;                      // Correo electrónico del usuario.
  photoURL?: string | null;            // URL de la foto de perfil del usuario (opcional).
  fechaCreacion: Timestamp;           // Fecha y hora en que se creó la cuenta del usuario.
  configuraciones?: ConfiguracionesUsuario; // Sub-objeto para las configuraciones (opcional).
  ultimoLogin?: Timestamp;             // Fecha y hora del último inicio de sesión (opcional).
  // Considera añadir otros campos relevantes para el perfil si los necesitas.
  // Ejemplo: nivelActual?: number; // Si tienes un sistema de niveles o gamificación.
}
