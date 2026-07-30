interface TextDownloadInput {
  text: string;
  fileName: string;
  mimeType: string;
}

const runDownloadCleanup = (cleanup: () => void, failureMessage: string): void => {
  try { cleanup(); } catch (error) { console.warn(failureMessage, error); }
};

export const triggerBlobDownload = (blob: Blob, fileName: string): void => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  try {
    link.href = url;
    link.download = fileName;
    (document.querySelector('dialog[open]') ?? document.body).appendChild(link);
    link.click();
  } finally {
    runDownloadCleanup(() => link.remove(), '移除临时下载链接失败:');
    globalThis.setTimeout(() => {
      runDownloadCleanup(() => URL.revokeObjectURL(url), '回收临时下载地址失败:');
    }, 0);
  }
};

export const triggerTextDownload = ({
  text,
  fileName,
  mimeType,
}: TextDownloadInput): void => {
  triggerBlobDownload(new Blob([text], { type: mimeType }), fileName);
};
