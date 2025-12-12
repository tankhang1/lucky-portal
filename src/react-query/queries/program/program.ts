import QUERY_KEY from "@/constants/key";
import PATH from "@/constants/path";
import { api } from "@/lib/axios";
import {
  getProgramDetailNumber,
  getProgramLuckyHistory,
  searchCustomer,
  searchGift,
  searchProgram,
  type TGetProgramDetailNumberReq,
  type TGetProgramDetailNumberRes,
  type TProgramLuckyHistoryReq,
  type TProgramLuckyHistoryRes,
  type TSearchProgramCustomerReq,
  type TSearchProgramCustomerRes,
  type TSearchProgramGiftReq,
  type TSearchProgramGiftRes,
  type TSearchProgramReq,
  type TSearchProgramRes,
} from "@/react-query/services/program/program.service";
import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";

export const useSearchProgram = (params: TSearchProgramReq) => {
  return useQuery<TSearchProgramRes, AxiosError<null>>({
    queryKey: [QUERY_KEY.PROGRAM.LIST, params],
    queryFn: () => searchProgram(params),
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
