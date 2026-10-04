import { BoxGeometry, Group, Mesh, MeshPhongMaterial, Texture } from "three";
import { describe, expect, it, vi } from "vite-plus/test";

import { clearMissingModelTextures, disposeModel } from "./modelResources";

describe("model resource cleanup", () => {
  it("releases shared geometry, materials, and textures once", () => {
    const geometry = new BoxGeometry();
    const texture = new Texture();
    const material = new MeshPhongMaterial({ map: texture, normalMap: texture });
    const group = new Group();
    group.add(new Mesh(geometry, material), new Mesh(geometry, [material, material]));
    const disposeTexture = vi.spyOn(texture, "dispose");
    const disposeMaterial = vi.spyOn(material, "dispose");
    const disposeGeometry = vi.spyOn(geometry, "dispose");
    disposeModel(group);
    expect(disposeTexture).toHaveBeenCalledTimes(1);
    expect(disposeMaterial).toHaveBeenCalledTimes(1);
    expect(disposeGeometry).toHaveBeenCalledTimes(1);
  });

  it("keeps loaded maps and base colors when another map fails", () => {
    const missing = new Texture();
    const loaded = new Texture({ width: 4, height: 4 });
    const material = new MeshPhongMaterial({ color: 0x669933, map: loaded, normalMap: missing });
    const disposeMissing = vi.spyOn(missing, "dispose");
    const disposeLoaded = vi.spyOn(loaded, "dispose");
    const group = new Group();
    group.add(new Mesh(new BoxGeometry(), material), new Mesh(new BoxGeometry(), material));
    clearMissingModelTextures(group);
    expect(material.normalMap).toBeNull();
    expect(material.map).toBe(loaded);
    expect(material.color.getHex()).toBe(0x669933);
    expect(disposeMissing).toHaveBeenCalledTimes(1);
    expect(disposeLoaded).not.toHaveBeenCalled();
    disposeModel(group);
  });
});
