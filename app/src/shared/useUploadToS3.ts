export default function useUploadToS3() {
  return {
    async put(url: string, body: Blob, contentType = 'application/octet-stream') {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      return true;
    },
  };
}

