const PATH = {
  AUTH: {
    SIGNIN: "/login",
  },
  PROGRAM: {
    SEARCH: "/zalo/campaign/search",
    GIFT: "/collect/gift/list",
    CUSTOMER: "/collect/consumer/list",
    CUSTOMER_LUCKY_HISTORY: "zalo/campaign/detail/number",
    LUCKY_HISTORY: "/zalo/campaign/lucky/history",
    UPDATE_INFO: "/program/update",
    ADD_INFO: "/program/add",
    DELETE_INFO: "/program/deactive",
    UPDATE_NUMBER_EXTRA: "/program/add-number-extra",
    REMOVE_NUMBER_EXTRA: "/program/remove-number-extra",
    ADD_PRIZE: "/program/add-gift",
    UPDATE_PRIZE: "/program/update-gift",
    DELETE_PRIZE: "/program/remove-gift",
    ADD_CUSTOMER: "/program/add-customer",
    DELETE_CUSTOMER: "/program/remove-consumer",
  },
  MEDIA: {
    UPLOAD_IMAGE: "/upload-files/image",
    UPLOAD_GIFT: "/upload-files/gift",
    UPLOAD_THUMBNAIL: "/upload-files/thumbnail",
    UPLOAD_PDF: "/upload-files/pdf",
    UPLOAD_AUDIO: "/upload-files/audio",
  },
};
export default PATH;
