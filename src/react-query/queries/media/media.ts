import {
  uploadAudio,
  uploadGift,
  uploadImage,
  uploadPdf,
  uploadThumbnail,
  type TUploadFileReq,
  type TUploadFileRes,
} from "@/react-query/services/media/media.service";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";

export const useUploadImage = () => {
  return useMutation<TUploadFileRes, AxiosError<null>, TUploadFileReq>({
    mutationFn: uploadImage,
    gcTime: 0, // Disable caching
  });
};

export const useUploadThumbnail = () => {
  return useMutation<TUploadFileRes, AxiosError<null>, TUploadFileReq>({
    mutationFn: uploadThumbnail,
    gcTime: 0, // Disable caching
  });
};

export const useUploadPdf = () => {
  return useMutation<TUploadFileRes, AxiosError<null>, TUploadFileReq>({
    mutationFn: uploadPdf,
    gcTime: 0, // Disable caching
  });
};

export const useUploadAudio = () => {
  return useMutation<TUploadFileRes, AxiosError<null>, TUploadFileReq>({
    mutationFn: uploadAudio,
    gcTime: 0, // Disable caching
  });
};

export const useUploadGift = () => {
  return useMutation<
    TUploadFileRes,
    AxiosError<null>,
    TUploadFileReq & { g: string }
  >({
    mutationFn: uploadGift,
    gcTime: 0, // Disable caching
  });
};
