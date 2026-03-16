import { Request } from "express";
import { AuthRequestUser } from "./auth-request-user.type";

export interface AuthRequest extends Request {
  user?: AuthRequestUser;
}
