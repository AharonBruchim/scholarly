import mongoose, { ClientSession } from "mongoose";

export const transaction = async <T>(
  func: (session: ClientSession) => Promise<T>
): Promise<T> => {
  let ret: T | undefined;

  await mongoose.connection.transaction(async (session) => {
    ret = await func(session);
  });

  return ret!;
};