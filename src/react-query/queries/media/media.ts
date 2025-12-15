import {
  uploadAudio,
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
  });
};

export const useUploadThumbnail = () => {
  return useMutation<TUploadFileRes, AxiosError<null>, TUploadFileReq>({
    mutationFn: uploadThumbnail,
  });
};

export const useUploadPdf = () => {
  return useMutation<TUploadFileRes, AxiosError<null>, TUploadFileReq>({
    mutationFn: uploadPdf,
  });
};

export const useUploadAudio = () => {
  return useMutation<TUploadFileRes, AxiosError<null>, TUploadFileReq>({
    mutationFn: uploadAudio,
  });
};
