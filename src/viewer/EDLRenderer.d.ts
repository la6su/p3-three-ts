import { PointCloudOctree } from 'point-cloud-octree';
import * as THREE from 'three';
import { EyeDomeLightingMaterial } from "../materials/EyeDomeLightingMaterial.js";
import { PointCloudSM } from "../utils/PointCloudSM.js";
  export class EDLRenderer {
    constructor(viewer: any);
    viewer: any;
    edlMaterial: EyeDomeLightingMaterial;
    gl: any;
    shadowMap: PointCloudSM;
    initEDL(): void;
    rtEDL: THREE.WebGLRenderTarget;
    rtRegular: THREE.WebGLRenderTarget;
    resize(width: any, height: any): void;
    makeScreenshot(camera: any, size: any, callback: any): {
      width: any;
      height: any;
      buffer: Uint8Array;
    };
    screenshot: {
      target: THREE.WebGLRenderTarget;
    };
    clearTargets(): void;
    clear(): void;
    renderShadowMap(visiblePointClouds: any, camera: any, lights: any): void;
    render(
      edlStrength: number,
      edlRadius: number,
      edlOpacity: number,
      pointClouds: PointCloudOctree[]
    ): void;
  }
