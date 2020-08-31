import { createContext } from 'react';
import { observable } from 'mobx';

export class User {
  @observable public isLoggedIn: boolean = false;
}

export const UserContext = createContext<User>(null as unknown as User);
