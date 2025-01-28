export class EyeDomeLightingMaterial extends THREE.RawShaderMaterial {
    constructor(parameters?: {});
    set neighbourCount(arg: any);
    get neighbourCount(): any;
    getDefines(): string;
    updateShaderSource(): void;
    needsUpdate: boolean;
    _neighbourCount: any;
    neighbours: Float32Array;
}
import * as THREE from "three";
