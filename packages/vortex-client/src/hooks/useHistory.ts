import { BrowserHistory } from "history";
import { createContext, useContext } from "react";

export const HistoryContext = createContext<BrowserHistory>(null as unknown as BrowserHistory);

export const useHistory = () => {
  return useContext(HistoryContext);
}
