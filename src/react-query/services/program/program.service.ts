import PATH from "@/constants/path";
import { api } from "@/lib/axios";

export type TProgram = {
  id: number;
  uuid: string;
  code: string;
  name: string;
  time_create: string;
  time_create_number: number;
  time_start?: string;
  time_start_number: number;
  time_end?: string;
  time_end_number: number;
  time_deactive?: string;
  time_deactive_number: number;
  time_active?: string;
  time_active_number: number;
  status: number;
  image_thumbnail: string;
  image_banner: string;
  description: string;
  description_short: string;
  number_start: number;
  number_end: number;
  number_loop: number;
  number_extra?: string;
  pdf_link?: string;
  audio_link?: string;
  type: number;
};

export type TSearchProgramRes = TProgram[];
export type TSearchProgramReq = {
  k?: string;
};

export const searchProgram = async (
  params: TSearchProgramReq
): Promise<TSearchProgramRes> => {
  const { data } = await api.get(PATH.PROGRAM.SEARCH, {
    params,
  });
  return data;
};

export type TProgramGift = {
  id: number;
  campaign_item: number;
  campaign_code: string;
  award_name: string;
  gift_code: string;
  gift_name: string;
  gift_image: string;
  gift_image_thumb: any;
  counter: number;
  limits: number;
  type_extra: number;
  status: number;
  time_create: any;
  time_deactive: any;
};
export type TSearchProgramGiftReq = {
  campaignCode: string;
  keyword?: string;
  type?: string;
};
export type TSearchProgramGiftRes = TProgramGift[];
export const searchGift = async (
  params: TSearchProgramGiftReq
): Promise<TSearchProgramGiftRes> => {
  const { data } = await api.get(PATH.PROGRAM.GIFT, {
    params,
  });
  return data;
};

export type TProgramCustomer = {
  id: number;
  campaign_item: number;
  campaign_code: string;
  consumer_code: string;
  consumer_name: string;
  consumer_phone: string;
  status: number;
  number_counter: number;
  number_get: number;
};
export type TSearchProgramCustomerReq = {
  campaignCode: string;
};
export type TSearchProgramCustomerRes = TProgramCustomer[];
export const searchCustomer = async (
  params: TSearchProgramCustomerReq
): Promise<TSearchProgramCustomerRes> => {
  const { data } = await api.get(PATH.PROGRAM.CUSTOMER, {
    params,
  });
  return data;
};

export type TProgramDetailNumber = {
  number: number;
  award_name?: string;
  gift_image: string;
  gift_name: string;
  time: string;
  award_time: string;
};
export type TGetProgramDetailNumberRes = TProgramDetailNumber[];
export type TGetProgramDetailNumberReq = {
  p: string;
  c: string;
};
export const getProgramDetailNumber = async (
  params: TGetProgramDetailNumberReq
): Promise<TGetProgramDetailNumberRes> => {
  const { data } = await api.get(PATH.PROGRAM.CUSTOMER_LUCKY_HISTORY, {
    params,
  });
  return data;
};

export type TProgramLuckyHistory = {
  number: number;
  consumer_name: string;
  award_name: string;
  gift_image: string;
  consumer_code: string;
  gift_name: string;
  consumer_phone: string;
  time: string;
  award_time: string;
};
export type TProgramLuckyHistoryReq = {
  c: string;
  g?: string;
  k?: string;
};
export type TProgramLuckyHistoryRes = TProgramLuckyHistory[];
export const getProgramLuckyHistory = async (
  params: TProgramLuckyHistoryReq
): Promise<TProgramLuckyHistoryRes> => {
  const { data } = await api.get(PATH.PROGRAM.LUCKY_HISTORY, {
    params,
  });
  return data;
};

export type TUpdateProgramInfoReq = {
  code: string;
  name: string;
  time_start_number: number;
  time_end_number: number;
  image_thumbnail: string;
  image_banner: string;
  description: string;
  description_short: string;
  pdf_link: string;
  audio_link: string;
};

export type TUpdateProgramInfoRes = {
  data: any;
  message: string;
};

export const updateProgramInfo = async (
  body: TUpdateProgramInfoReq
): Promise<TUpdateProgramInfoRes> => {
  const { data } = await api.post(PATH.PROGRAM.UPDATE_INFO, body);
  return data;
};

export type TAddProgramInfoReq = {
  code: string;
  name: string;
  time_start_number: number;
  time_end_number: number;
  image_thumbnail: string;
  image_banner: string;
  description: string;
  description_short: string;
  number_start: number;
  number_end: number;
  number_loop: number;
  pdf_link: string;
  audio_link: string;
};
export type TAddProgramInfoRes = {
  data: any;
  message: string;
};
export const addProgramInfo = async (
  body: TAddProgramInfoReq
): Promise<TAddProgramInfoRes> => {
  const { data } = await api.post(PATH.PROGRAM.ADD_INFO, body);
  return data;
};

export type TDeleteProgramInfoReq = {
  code: string;
};

export type TDeleteProgramInfoRes = {
  data: any;
  message: string;
};
export const deleteProgramInfo = async (
  body: TDeleteProgramInfoReq
): Promise<TDeleteProgramInfoRes> => {
  const { data } = await api.post(PATH.PROGRAM.DELETE_INFO, body);
  return data;
};
export type TUpdateExtraNumberReq = {
  code: string;
  number_extra: string;
};
export type TUpdateExtraNumberRes = {
  data: any;
  message: string;
};
export const updateExtraNumber = async (
  body: TUpdateExtraNumberReq
): Promise<TUpdateExtraNumberRes> => {
  const { data } = await api.post(PATH.PROGRAM.UPDATE_NUMBER_EXTRA, body);
  return data;
};
export type TRemoveNumberExtraReq = {
  campaign_code: string;
  number_extra: number;
};
export const removeExtraNumber = async (
  body: TRemoveNumberExtraReq
): Promise<TUpdateExtraNumberRes> => {
  const { data } = await api.post(PATH.PROGRAM.REMOVE_NUMBER_EXTRA, body);
  return data;
};
export type TProgramPrizeReq = {
  campaign_code: string;
  award_name: string;
  gift_code: string;
  gift_name: string;
  gift_image: string;
  gift_image_thumb: string;
  limits: number;
  type_extra: number;
};

export type TDeactiveProgramPrizeReq = {
  campaign_code: string;
  gift_code: string;
};
export type TProgramPrizeRes = {
  data: any;
  message: string;
};
export const updateProgramPrize = async (
  body: TProgramPrizeReq
): Promise<TProgramPrizeRes> => {
  const { data } = await api.post(PATH.PROGRAM.UPDATE_PRIZE, body);
  return data;
};

export const addProgramPrize = async (
  body: TProgramPrizeReq
): Promise<TProgramPrizeRes> => {
  const { data } = await api.post(PATH.PROGRAM.ADD_PRIZE, body);
  return data;
};

export const deactiveProgramPrize = async (
  body: TProgramPrizeReq
): Promise<TProgramPrizeRes> => {
  const { data } = await api.post(PATH.PROGRAM.DELETE_PRIZE, body);
  return data;
};

export type TCustomerForm = {
  campaign_code: string;
  consumer_code: string;
  consumer_name: string;
  consumer_phone: string;
};
export type TAddCustomerReq = TCustomerForm;
export type TAddCustomerRes = {
  data: any;
  message: string;
};
export const addCustomer = async (
  body: TAddCustomerReq
): Promise<TAddCustomerRes> => {
  const { data } = await api.post(PATH.PROGRAM.ADD_CUSTOMER, body);
  return data;
};
export type TDeleteCustomerReq = {
  campaign_code: string;
  consumer_phone: string;
};
export type TDeleteCustomerRes = {
  data: any;
  message: string;
};
export const deleteCustomer = async (
  body: TDeleteCustomerReq
): Promise<TDeleteCustomerRes> => {
  const { data } = await api.post(PATH.PROGRAM.DELETE_CUSTOMER, body);
  return data;
};
