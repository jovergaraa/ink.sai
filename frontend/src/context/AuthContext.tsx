import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Perfil } from '../types';

interface ResultadoAuth {
  error: string | null;
}

interface ResultadoRegistro extends ResultadoAuth {
  necesitaConfirmar: boolean;
}

type ResultadoVerificacion = ResultadoAuth;

interface DatosRegistro {
  correo: string;
  password: string;
  nombre: string;
  rut: string;
  telefono: string;
  fechaNacimiento: string;
  aceptoTerminos: boolean;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  perfil: Perfil | null;
  loading: boolean;
  signIn: (correo: string, password: string) => Promise<ResultadoAuth>;
  signUp: (datos: DatosRegistro) => Promise<ResultadoRegistro>;
  verifyOtp: (correo: string, token: string) => Promise<ResultadoVerificacion>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function traducirError(error: AuthError): string {
  const codigo = error.code ?? '';
  const mensaje = error.message ?? '';

  switch (codigo) {
    case 'invalid_credentials':
      return 'Correo o contraseña incorrectos.';
    case 'email_not_confirmed':
      return 'Debes confirmar tu correo antes de ingresar. Revisa tu bandeja.';
    case 'user_already_exists':
    case 'email_exists':
      return 'Ese correo ya está registrado.';
    case 'weak_password':
      return 'La contraseña debe tener al menos 8 caracteres.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Demasiados intentos. Espera unos minutos.';
    case 'validation_failed':
      return 'Revisa que el correo tenga un formato válido.';
    case 'otp_expired':
      return 'El código venció. Pide uno nuevo.';
    case 'otp_disabled':
      return 'No pudimos verificar el código. Intenta de nuevo.';
  }

  if (mensaje.includes('Password should be at least')) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }
  if (mensaje.includes('Invalid login credentials')) {
    return 'Correo o contraseña incorrectos.';
  }
  if (mensaje.includes('Email not confirmed')) {
    return 'Debes confirmar tu correo antes de ingresar. Revisa tu bandeja.';
  }
  if (mensaje.includes('Token has expired') || mensaje.includes('invalid')) {
    return 'El código es incorrecto o venció. Revísalo o pide uno nuevo.';
  }

  return 'No pudimos completar la acción. Intenta de nuevo.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [authListo, setAuthListo] = useState(false);
  const [perfilListo, setPerfilListo] = useState(false);

  // Sesión: arranque desde localStorage + suscripción a los cambios.
  useEffect(() => {
    let vivo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!vivo) return;
      setSession(data.session);
      setAuthListo(true);
    });

    // Ojo: nada async de Supabase aquí dentro. El cliente mantiene un lock
    // mientras corre el callback y un await lo deja en deadlock.
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      if (!vivo) return;
      setSession(nuevaSesion);
      setAuthListo(true);
    });

    return () => {
      vivo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Perfil: efecto aparte, reaccionando al id de usuario.
  const userId = session?.user.id ?? null;
  useEffect(() => {
    if (!userId) {
      setPerfil(null);
      setPerfilListo(true);
      return;
    }

    let cancelado = false;
    setPerfilListo(false);

    supabase
      .from('usuarios')
      .select('id, correo, nombre, rol, created_at, rut, telefono, fecha_nacimiento')
      .eq('id', userId)
      // maybeSingle: si el perfil quedó huérfano devuelve null en vez de error
      .maybeSingle()
      .then(({ data }) => {
        if (cancelado) return;
        setPerfil((data as Perfil | null) ?? null);
        setPerfilListo(true);
      });

    return () => {
      cancelado = true;
    };
  }, [userId]);

  const valor = useMemo<AuthContextValue>(() => {
    const loading = !authListo || (session !== null && !perfilListo);

    return {
      session,
      user: session?.user ?? null,
      perfil,
      loading,

      async signIn(correo, password) {
        const { error } = await supabase.auth.signInWithPassword({
          email: correo,
          password,
        });
        return { error: error ? traducirError(error) : null };
      },

      async signUp({ correo, password, nombre, rut, telefono, fechaNacimiento, aceptoTerminos }) {
        const { data, error } = await supabase.auth.signUp({
          email: correo,
          password,
          options: {
            data: {
              nombre,
              rut,
              telefono,
              fecha_nacimiento: fechaNacimiento,
              acepto_terminos: aceptoTerminos,
            },
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });

        if (error) {
          return { error: traducirError(error), necesitaConfirmar: false };
        }

        // Con la protección anti-enumeración, un correo ya registrado
        // devuelve un usuario falso sin identidades. No lo delatamos.
        return { error: null, necesitaConfirmar: data.session === null };
      },

      async verifyOtp(correo, token) {
        const { error } = await supabase.auth.verifyOtp({
          email: correo,
          token,
          type: 'signup',
        });
        // Éxito: verifyOtp ya deja la sesión activa, onAuthStateChange
        // la recoge solo — no hay nada más que hacer acá.
        return { error: error ? traducirError(error) : null };
      },

      async signOut() {
        await supabase.auth.signOut();
        setPerfil(null);
      },
    };
  }, [session, perfil, authListo, perfilListo]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}
