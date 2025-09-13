// Use legacy API for uploadAsync on Expo 54+
import * as FileSystem from 'expo-file-system/legacy';

export default function useUploadToS3() {
  return {
    async put(url: string, body: Blob | { uri: string }, contentType = 'application/octet-stream') {
      if (typeof (body as any).uri === 'string') {
        const { uri } = body as any;
        const res = await FileSystem.uploadAsync(url, uri, {
          httpMethod: 'PUT',
          headers: { 'Content-Type': contentType },
          // In Expo SDK 54+, uploadType defaults to binary; avoid referencing enum
        });
        if (res.status < 200 || res.status >= 300) throw new Error(`Upload failed: ${res.status}`);
        return true;
      } else {
        const res = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': contentType },
          body: body as Blob,
        });
        if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
        return true;
      }
    },
  };
}
