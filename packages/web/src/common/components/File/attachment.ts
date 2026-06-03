export interface FileDetail {
  id: string;
  name: string;
  url: string;
}

export type FilePreviewType = "image" | "pdf" | "unsupported";
export type FileOpen = (
  url: string,
  target: string,
  features: string,
) => unknown;

const getFileExtension = (file: FileDetail) =>
  (file.name.split(".").pop() || "unknown").toLowerCase();

export const getFilePreviewType = (file: FileDetail): FilePreviewType => {
  const fileExt = getFileExtension(file);
  const previewSupportFile = ["png", "jpeg", "jpg", "webp", "svg"];

  if (previewSupportFile.includes(fileExt)) {
    return "image";
  }

  if (fileExt === "pdf") {
    return "pdf";
  }

  return "unsupported";
};

export const isPreviewSupported = (file: FileDetail) =>
  getFilePreviewType(file) === "image";

export const openFileInNewTab = (file: FileDetail, open: FileOpen) => {
  open(file.url, "_blank", "noopener,noreferrer");
};
