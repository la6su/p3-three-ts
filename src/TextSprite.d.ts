export class TextSprite extends THREE.Object3D {
    constructor(text: any);
    texture: THREE.Texture;
    material: THREE.SpriteMaterial;
    sprite: THREE.Sprite;
    borderThickness: number;
    fontface: string;
    fontsize: number;
    borderColor: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    backgroundColor: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    textColor: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    text: string;
    setText(text: any): void;
    setTextColor(color: any): void;
    setBorderColor(color: any): void;
    setBackgroundColor(color: any): void;
    update(): void;
    roundRect(ctx: any, x: any, y: any, w: any, h: any, r: any): void;
}
import * as THREE from "three";
