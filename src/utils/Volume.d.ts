export class Volume extends THREE.Object3D {
    constructor(args?: {});
    _clip: any;
    _visible: boolean;
    showVolumeLabel: boolean;
    _modifiable: any;
    label: TextSprite;
    getVolume(): void;
    update(): void;
    raycast(raycaster: any, intersects: any): void;
    set clip(arg: any);
    get clip(): any;
    set modifieable(arg: any);
    get modifieable(): any;
}
export class BoxVolume extends Volume {
    material: THREE.MeshBasicMaterial;
    box: THREE.Mesh;
    boundingBox: any;
    frame: THREE.LineSegments;
    boundingSphere: any;
    getVolume(): number;
}
export class SphereVolume extends Volume {
    material: THREE.MeshBasicMaterial;
    sphere: THREE.Mesh;
    boundingBox: any;
    frame: THREE.Mesh;
    boundingSphere: any;
    getVolume(): number;
}
import * as THREE from "../../libs/three.js/build/three.module.js";
import { TextSprite } from "../TextSprite.js";
