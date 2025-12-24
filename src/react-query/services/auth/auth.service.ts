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

export type TCheckTokenExpireReq = {
  token: string;
};
export type TCheckTokenExpireRes = boolean;
export const checkTokenExpire = async (
  body: TCheckTokenExpireReq
): Promise<TCheckTokenExpireRes> => {
  const { data } = await api.post(PATH.AUTH.CHECK_TOKEN, body);
  return data;
};
