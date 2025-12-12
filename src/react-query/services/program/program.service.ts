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
