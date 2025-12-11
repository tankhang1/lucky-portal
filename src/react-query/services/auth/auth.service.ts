import PATH from "@/constants/path";
import { api } from "@/lib/axios";

export type TLoginReq = {
  username: string;
  password: string;
};
export type TLoginRes = {
  token: string;
};
export const login = async (body: TLoginReq): Promise<TLoginRes> => {
  const { data } = await api.post(PATH.AUTH.SIGNIN, body);
  return data;
};
