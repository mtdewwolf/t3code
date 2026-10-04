import { parseFbxForTransfer } from "./fbxWorkerParser";
import type { TransferredModel } from "./modelTransfer";

export interface FbxWorkerRequest {
  bytes: ArrayBuffer;
  basePath: string;
}
export type FbxWorkerResponse =
  | { type: "loaded"; model: TransferredModel }
  | { type: "error"; message: string };

self.addEventListener("message", async (event: MessageEvent<FbxWorkerRequest>) => {
  try {
    const { payload, transfer } = await parseFbxForTransfer(event.data.bytes, event.data.basePath);
    self.postMessage({ type: "loaded", model: payload } satisfies FbxWorkerResponse, { transfer });
  } catch (error) {
    const message = {
      type: "error",
      message: error instanceof Error ? error.message : "Could not parse this FBX file.",
    } satisfies FbxWorkerResponse;
    // oxlint-disable-next-line unicorn/require-post-message-target-origin -- Worker messages do not accept a target origin.
    self.postMessage(message);
  }
});
