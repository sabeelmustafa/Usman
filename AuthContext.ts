
import React from 'react';
import { User } from './types';

export const AuthContext = React.createContext<{
  user: User | null;
  login: (u: User, remember: boolean) => void;
  logout: () => void;
  updateUser: (u: User) => void;
}>({
  user: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {}
});
