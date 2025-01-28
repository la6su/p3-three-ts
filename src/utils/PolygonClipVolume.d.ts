export class PolygonClipVolume extends THREE.Object3D {
    constructor(camera: any);
    camera: any;
    viewMatrix: any;
    projMatrix: any;
    markers: any[];
    initialized: boolean;
    addMarker(): void;
    removeLastMarker(): void;
}
import * as THREE from "three";
