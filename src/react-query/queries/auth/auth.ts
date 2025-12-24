import {
  checkTokenExpire,
  login,
  type TCheckTokenExpireReq,
  type TCheckTokenExpireRes,
  type TLoginReq,
  type TLoginRes,
} from "@/react-query/services/auth/auth.service";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";

export const useLogin = () => {
  return useMutation<TLoginRes, AxiosError<null>, TLoginReq>({
    mutationFn: login,
  });
};

export const useCheckTokenExpire = () => {
  return useMutation<
    TCheckTokenExpireRes,
    AxiosError<null>,
    TCheckTokenExpireReq
  >({
    mutationFn: checkTokenExpire,
  });
};
