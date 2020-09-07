import { UserToken } from "./routes/auth";

// Add 'UserToken' type to express request
declare module 'express-serve-static-core' {
  interface Request {
    user?: UserToken
  }
}

// Import JSON
declare module '*.json'{
  var exp:any;
  export = exp;
}
