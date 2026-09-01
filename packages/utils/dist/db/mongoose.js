import mongoose from "mongoose";
export const transaction = async (func) => {
    let ret;
    await mongoose.connection.transaction(async (session) => {
        ret = await func(session);
    });
    return ret;
};
//# sourceMappingURL=mongoose.js.map