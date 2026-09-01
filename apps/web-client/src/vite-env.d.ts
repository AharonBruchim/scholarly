/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "vite-plugin-raw";

declare module "*.ttf" {
  const src: string;
  export default src;
}

declare module "*.ttf?arraybuffer" {
  const src: ArrayBuffer;
  export default src;
}
