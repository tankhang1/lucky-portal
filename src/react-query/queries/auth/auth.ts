import {
  login,
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
