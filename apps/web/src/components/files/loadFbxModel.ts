import type { FbxWorkerRequest, FbxWorkerResponse } from "./fbx.worker";
import type { TransferredModel } from "./modelTransfer";

/** One job per worker allows an obsolete synchronous parse to be stopped immediately. */
export function parseFbxInWorker(bytes: ArrayBuffer, basePath: string, signal: AbortSignal) {
  return new Promise<TransferredModel>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Model loading was cancelled.", "AbortError"));
      return;
    }
    const worker = new Worker(new URL("./fbx.worker.ts", import.meta.url), { type: "module" });
    const finish = () => {
      signal.removeEventListener("abort", onAbort);
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
      worker.removeEventListener("messageerror", onMessageError);
      worker.terminate();
    };
    const onAbort = () => {
      finish();
      reject(new DOMException("Model loading was cancelled.", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    const onMessage = (event: MessageEvent<FbxWorkerResponse>) => {
      finish();
      if (event.data.type === "loaded") resolve(event.data.model);
      else reject(new Error(event.data.message));
    };
    const onError = (event: ErrorEvent) => {
      event.preventDefault();
      finish();
      reject(new Error(event.message || "The model loading worker failed."));
    };
    const onMessageError = () => {
      finish();
      reject(new Error("Could not receive the parsed FBX model."));
    };
    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);
    worker.addEventListener("messageerror", onMessageError);
    try {
      worker.postMessage({ bytes, basePath } satisfies FbxWorkerRequest, [bytes]);
    } catch (error) {
      finish();
      reject(error);
    }
  });
}
