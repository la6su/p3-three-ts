export class PointCloudSM {
    constructor(potreeRenderer: any);
    potreeRenderer: any;
    threeRenderer: any;
    target: THREE.WebGLRenderTarget;
    setLight(light: any): void;
    light: any;
    camera: THREE.PerspectiveCamera;
    setSize(width: any, height: any): void;
    render(scene: any, camera: any): void;
}
import * as THREE from "../../libs/three.js/build/three.module.js";
