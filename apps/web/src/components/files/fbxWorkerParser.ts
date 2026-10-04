import { Loader, LoadingManager, Texture } from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { packModel } from "./modelTransfer";

/** Worker-only texture adapter: record references; DOM image loading stays in the viewer. */
export async function parseFbxForTransfer(bytes: ArrayBuffer, basePath: string) {
  const imageUrls = new Map<string, string | Blob>();
  const pendingImages: Promise<void>[] = [];
  class DeferredTextureLoader extends Loader<Texture> {
    override load(url: string) {
      const texture = new Texture();
      const resolved = `${this.path || ""}${url}`;
      if (resolved.startsWith("blob:")) {
        pendingImages.push(
          (async () => {
            try {
              imageUrls.set(texture.source.uuid, await (await fetch(resolved)).blob());
            } finally {
              URL.revokeObjectURL(resolved);
            }
          })(),
        );
      } else imageUrls.set(texture.source.uuid, resolved);
      return texture;
    }
  }
  const manager = new LoadingManager();
  manager.addHandler(/./, new DeferredTextureLoader(manager));
  const model = new FBXLoader(manager).parse(bytes, basePath);
  await Promise.all(pendingImages);
  return packModel(model, imageUrls);
}
