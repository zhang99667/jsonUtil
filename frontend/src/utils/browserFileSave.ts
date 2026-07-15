interface TextDownloadInput {
  text: string;
  fileName: string;
  mimeType: string;
}

export const triggerBlobDownload = (blob: Blob, fileName: string): void => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  try {
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
  } finally {
    try {
      link.remove();
    } finally {
      globalThis.setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  }
};

export const triggerTextDownload = ({
  text,
  fileName,
  mimeType,
}: TextDownloadInput): void => {
  triggerBlobDownload(new Blob([text], { type: mimeType }), fileName);
};
