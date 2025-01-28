export class Utils {
    static loadShapefileFeatures(file: any, callback: any): Promise<void>;
    static toString(value: any): string;
    static normalizeURL(url: any): string;
    static pathExists(url: any): boolean;
    static debugSphere(parent: any, position: any, scale: any, color: any): THREE.Mesh;
    static debugLine(parent: any, start: any, end: any, color: any): {
        node: THREE.Line;
        set: (start: any, end: any) => void;
    };
    static debugCircle(parent: any, center: any, radius: any, normal: any, color: any): void;
    static debugBox(parent: any, box: any, transform?: THREE.Matrix4, color?: number): void;
    static debugPlane(parent: any, plane: any, size?: number, color?: number): void;
    /**
     * adapted from mhluska at https://github.com/mrdoob/three.js/issues/1561
     */
    static computeTransformedBoundingBox(box: any, transform: any): THREE.Box3;
    /**
     * add separators to large numbers
     *
     * @param nStr
     * @returns
     */
    static addCommas(nStr: any): string;
    static removeCommas(str: any): any;
    /**
     * create worker from a string
     *
     * code from http://stackoverflow.com/questions/10343913/how-to-create-a-web-worker-from-a-string
     */
    static createWorker(code: any): Worker;
    static moveTo(scene: any, endPosition: any, endTarget: any): void;
    static loadSkybox(path: any): {
        camera: THREE.PerspectiveCamera;
        scene: THREE.Scene;
        parent: THREE.Object3D;
    };
    static createGrid(width: any, length: any, spacing: any, color: any): THREE.LineSegments;
    static createBackgroundTexture(width: any, height: any): THREE.DataTexture;
    static getMousePointCloudIntersection(mouse: any, camera: any, viewer: any, pointclouds: any, params?: {}): {
        location: any;
        distance: number;
        pointcloud: any;
        point: any;
    };
    static pixelsArrayToImage(pixels: any, width: any, height: any): HTMLImageElement;
    static pixelsArrayToDataUrl(pixels: any, width: any, height: any): string;
    static pixelsArrayToCanvas(pixels: any, width: any, height: any): HTMLCanvasElement;
    static removeListeners(dispatcher: any, type: any): void;
    static mouseToRay(mouse: any, camera: any, width: any, height: any): THREE.Ray;
    static projectedRadius(radius: any, camera: any, distance: any, screenWidth: any, screenHeight: any): any;
    static projectedRadiusPerspective(radius: any, fov: any, distance: any, screenHeight: any): number;
    static projectedRadiusOrtho(radius: any, proj: any, screenWidth: any, screenHeight: any): any;
    static topView(camera: any, node: any): void;
    static frontView(camera: any, node: any): void;
    static leftView(camera: any, node: any): void;
    static rightView(camera: any, node: any): void;
    static findClosestGpsTime(target: any, viewer: any): {
        node: any;
        index: number;
        position: THREE.Vector3;
    };
    /**
     *
     * 0: no intersection
     * 1: intersection
     * 2: fully inside
     */
    static frustumSphereIntersection(frustum: any, sphere: any): 0 | 1 | 2;
    static generateDataTexture(width: any, height: any, color: any): THREE.DataTexture;
    static getParameterByName(name: any): string;
    static setParameter(name: any, value: any): void;
    static createChildAABB(aabb: any, index: any): THREE.Box3;
    static clipboardCopy(text: any): void;
    static getMeasurementIcon(measurement: any): string;
    static lineToLineIntersection(P0: any, P1: any, P2: any, P3: any): any;
    static computeCircleCenter(A: any, B: any, C: any): any;
    static getNorthVec(p1: any, distance: any, projection: any): THREE.Vector3;
    static computeAzimuth(p1: any, p2: any, projection: any): number;
    static loadScript(url: any): Promise<any>;
    static createSvgGradient(scheme: any): SVGSVGElement;
    static waitAny(promises: any): Promise<any>;
}
import * as THREE from "three";
