import { action, computed, observable } from 'mobx';
import { axiosInstance } from './network';
import { createContext } from 'react';

const SESSION_KEY = 'session';

export class Session {
  @observable public token: string | null = null;

  constructor() {
    this.token = localStorage.getItem(SESSION_KEY) || null;
    axiosInstance.interceptors.request.use(config => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  @computed
  public get isLoggedIn() {
    return Boolean(this.token);
  }

  @action
  public signIn(token: string) {
    this.token = token;
    localStorage.setItem(SESSION_KEY, this.token);
  }

  @action
  public signOut() {
    this.token = null;
    localStorage.removeItem(SESSION_KEY);
  }
}

export const SessionContext = createContext<Session>((null as unknown) as Session);
