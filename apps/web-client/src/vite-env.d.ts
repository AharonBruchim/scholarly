/// <reference types="vite/client" />

declare module "vite-plugin-raw";

declare module "*.ttf" {
  const src: string;
  export default src;
}

declare module "*.ttf?arraybuffer" {
  const src: ArrayBuffer;
  export default src;
}
