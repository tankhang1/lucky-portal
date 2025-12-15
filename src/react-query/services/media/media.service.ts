import PATH from "@/constants/path";
import { api } from "@/lib/axios";

export type TUploadFileReq = {
  c: string;
  file: File;
};
export type TUploadFileRes = string;
export const uploadImage = async (
  body: TUploadFileReq
): Promise<TUploadFileRes> => {
  const formData = new FormData();
  formData.append("c", body.c);
  formData.append("file", body.file);
  const { data } = await api.post(PATH.MEDIA.UPLOAD_IMAGE, formData);
  return data;
};

export const uploadThumbnail = async (
  body: TUploadFileReq
): Promise<TUploadFileRes> => {
  const formData = new FormData();
  formData.append("c", body.c);
  formData.append("file", body.file);
  const { data } = await api.post(PATH.MEDIA.UPLOAD_THUMBNAIL, formData);
  return data;
};

export const uploadPdf = async (
  body: TUploadFileReq
): Promise<TUploadFileRes> => {
  const formData = new FormData();
  formData.append("c", body.c);
  formData.append("file", body.file);
  const { data } = await api.post(PATH.MEDIA.UPLOAD_PDF, formData);
  return data;
};

export const uploadAudio = async (
  body: TUploadFileReq
): Promise<TUploadFileRes> => {
  const formData = new FormData();
  formData.append("c", body.c);
  formData.append("file", body.file);
  const { data } = await api.post(PATH.MEDIA.UPLOAD_AUDIO, formData);
  return data;
};
