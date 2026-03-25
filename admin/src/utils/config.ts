const fromEnv =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? ""
    : "";

export const baseURL: string = fromEnv
  ? fromEnv.endsWith("/")
    ? fromEnv
    : `${fromEnv}/`
  : "https://admin.quietchat.in/";
export const key: string = "P~R920%(~BVUT.sDKe[M):h[=NNeF";
export const projectName: string = "Quiet Chat";
export const apiKey: string = "AIzaSyC_HEYJOdxXv3K3IBjsH3ASylDf5W2AtOM";
export const authDomain : string = "quiet-chat-e419b.firebaseapp.com";
export const projectId : string = "quiet-chat-e419b";
export const storageBucket : string = "quiet-chat-e419b.firebasestorage.app";
export const messagingSenderId : string = "254488666064";
export const appId : string = "1:254488666064:web:4ab7238a1863135ff7a3d5";
export const measurementId : string = "G-KL2XBHL0KP"
