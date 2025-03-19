// src/@types/express.d.ts

import { IPlan, IRole } from "../../dto";

interface IUserInRequest {
    id: string 
    role: IRole 
    plan: IPlan | null   
}

declare global {
    namespace Express {
        interface Request {
            user?: IUserInRequest;
        }
    }
}
