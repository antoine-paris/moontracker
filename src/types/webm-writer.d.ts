declare module 'webm-writer' {
  export default class WebMWriter {
    constructor(options?: { quality?: number; frameRate?: number; transparent?: boolean });
    addFrame(source: HTMLCanvasElement | OffscreenCanvas | HTMLVideoElement | ImageBitmap | HTMLImageElement, options?: any): Promise<void>;
    complete(): Promise<Blob>;
  }
}