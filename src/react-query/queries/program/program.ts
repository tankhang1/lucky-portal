import QUERY_KEY from "@/constants/key";
import PATH from "@/constants/path";
import { api } from "@/lib/axios";
import {
  addCustomer,
  addProgramInfo,
  addProgramPrize,
  deactiveProgramPrize,
  deleteCustomer,
  deleteProgramInfo,
  getProgramDetailNumber,
  getProgramLuckyHistory,
  removeExtraNumber,
  searchCustomer,
  searchGift,
  searchProgram,
  updateExtraNumber,
  updateProgramInfo,
  updateProgramPrize,
  type TAddCustomerReq,
  type TAddCustomerRes,
  type TAddProgramInfoReq,
  type TAddProgramInfoRes,
  type TDeleteCustomerReq,
  type TDeleteCustomerRes,
  type TDeleteProgramInfoReq,
  type TDeleteProgramInfoRes,
  type TGetProgramDetailNumberReq,
  type TGetProgramDetailNumberRes,
  type TProgramLuckyHistoryReq,
  type TProgramLuckyHistoryRes,
  type TProgramPrizeReq,
  type TProgramPrizeRes,
  type TRemoveNumberExtraReq,
  type TSearchProgramCustomerReq,
  type TSearchProgramCustomerRes,
  type TSearchProgramGiftReq,
  type TSearchProgramGiftRes,
  type TSearchProgramReq,
  type TSearchProgramRes,
  type TUpdateExtraNumberReq,
  type TUpdateExtraNumberRes,
  type TUpdateProgramInfoReq,
  type TUpdateProgramInfoRes,
} from "@/react-query/services/program/program.service";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";

export const useSearchProgram = (params: TSearchProgramReq) => {
  return useQuery<TSearchProgramRes, AxiosError<null>>({
    queryKey: [QUERY_KEY.PROGRAM.LIST, params],
    queryFn: () => searchProgram(params),
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });
};

export const useSearchGift = (params: TSearchProgramGiftReq) => {
  return useQuery<TSearchProgramGiftRes, AxiosError<null>>({
    queryKey: [QUERY_KEY.PROGRAM.GIFT_LIST, params],
    queryFn: () => searchGift(params),
  });
};

export const useSearchCustomer = (params: TSearchProgramCustomerReq) => {
  return useQuery<TSearchProgramCustomerRes, AxiosError<null>>({
    queryKey: [QUERY_KEY.PROGRAM.CUSTOMER_LIST, params],
    queryFn: () => searchCustomer(params),
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });
};

export const useGetProgramNumberDetail = (
  params: TGetProgramDetailNumberReq
) => {
  return useQuery<TGetProgramDetailNumberRes, AxiosError<null>>({
    queryKey: [QUERY_KEY.PROGRAM.CUSTOMER_LUCKY_LIST, params],
    queryFn: () => getProgramDetailNumber(params),
    enabled: !!params,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });
};

export const useGetProgramLuckyHistory = (params: TProgramLuckyHistoryReq) => {
  return useQuery<TProgramLuckyHistoryRes, AxiosError<null>>({
    queryKey: [QUERY_KEY.PROGRAM.CUSTOMER_LUCKY_LIST, params],
    queryFn: () => getProgramLuckyHistory(params),
    enabled: !!params,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });
};

export const useUpdateProgramInfo = () => {
  return useMutation<
    TUpdateProgramInfoRes,
    AxiosError<null>,
    TUpdateProgramInfoReq
  >({
    mutationFn: updateProgramInfo,
  });
};

export const useAddProgramInfo = () => {
  return useMutation<TAddProgramInfoRes, AxiosError<null>, TAddProgramInfoReq>({
    mutationFn: addProgramInfo,
  });
};
export const useDeleteProgramInfo = () => {
  return useMutation<
    TDeleteProgramInfoRes,
    AxiosError<null>,
    TDeleteProgramInfoReq
  >({
    mutationFn: deleteProgramInfo,
  });
};
export const useUpdateNumberExtra = () => {
  return useMutation<
    TUpdateExtraNumberRes,
    AxiosError<null>,
    TUpdateExtraNumberReq
  >({
    mutationFn: updateExtraNumber,
  });
};
export const useRemoveNumberExtra = () => {
  return useMutation<
    TUpdateExtraNumberRes,
    AxiosError<null>,
    TRemoveNumberExtraReq
  >({
    mutationFn: removeExtraNumber,
  });
};
export const useUpdateProgramPrize = () => {
  return useMutation<TProgramPrizeRes, AxiosError<null>, TProgramPrizeReq>({
    mutationFn: updateProgramPrize,
  });
};

export const useAddProgramPrize = () => {
  return useMutation<TProgramPrizeRes, AxiosError<null>, TProgramPrizeReq>({
    mutationFn: addProgramPrize,
  });
};

export const useDeactiveProgramPrize = () => {
  return useMutation<TProgramPrizeRes, AxiosError<null>, TProgramPrizeReq>({
    mutationFn: deactiveProgramPrize,
  });
};

export const useAddProgramCustomer = () => {
  return useMutation<TAddCustomerRes, AxiosError<null>, TAddCustomerReq>({
    mutationFn: addCustomer,
  });
};

export const useDeleteProgramCustomer = () => {
  return useMutation<TDeleteCustomerRes, AxiosError<null>, TDeleteCustomerReq>({
    mutationFn: deleteCustomer,
  });
};
