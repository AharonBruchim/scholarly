import { ClientSession } from "mongoose";
export declare const transaction: <T>(func: (session: ClientSession) => Promise<T>) => Promise<T>;
//# sourceMappingURL=mongoose.d.ts.map