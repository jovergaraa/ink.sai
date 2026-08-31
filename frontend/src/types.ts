export interface Piece {
  n: string;
  title: string;
  year: string;
  image?: string;
}

export type ViewState = 'home';

export type Rol = 'cliente' | 'admin';

export interface Perfil {
  id: string;
  correo: string;
  nombre: string;
  rol: Rol;
  created_at?: string;
}
