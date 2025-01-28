export class Profile extends THREE.Object3D {
    points: any[];
    spheres: any[];
    edges: any[];
    boxes: any[];
    width: number;
    height: number;
    _modifiable: boolean;
    sphereGeometry: THREE.SphereGeometry;
    color: THREE.Color;
    lineColor: THREE.Color;
    createSphereMaterial(): THREE.MeshLambertMaterial;
    getSegments(): {
        start: any;
        end: any;
    }[];
    getSegmentMatrices(): THREE.Matrix4[];
    addMarker(point: any): void;
    removeMarker(index: any): void;
    setPosition(index: any, position: any): void;
    setWidth(width: any): void;
    getWidth(): number;
    update(): void;
    raycast(raycaster: any, intersects: any): void;
    set modifiable(arg: boolean);
    get modifiable(): boolean;
}
import * as THREE from "three";
