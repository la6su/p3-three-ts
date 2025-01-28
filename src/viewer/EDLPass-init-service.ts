import { ShaderPass } from 'postprocessing';
import { EyeDomeLightingMaterial } from '../materials/EyeDomeLightingMaterial.js';
import {
  DepthTexture,
  FloatType,
  NearestFilter,
  RGBAFormat,
  UnsignedIntType,
  Vector2,
  WebGLRenderTarget,
} from 'three';

export class EdlPassInitService  {
  control: ShaderPass;

  edlMaterial: EyeDomeLightingMaterial | null = null;
  rtEDL!: WebGLRenderTarget;
  isEnabled: boolean;


  initialize(): void {
    this.rtEDL = new WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight,
      {
        minFilter: NearestFilter,
        magFilter: NearestFilter,
        format: RGBAFormat,
        type: FloatType,
        depthBuffer: true,
        depthTexture: new DepthTexture(undefined, undefined, UnsignedIntType),
      }
    );

    this.edlMaterial = new EyeDomeLightingMaterial();
    this.edlMaterial.depthTest = true;
    this.edlMaterial.depthWrite = true;
    this.edlMaterial.transparent = true;

    this.isEnabled = false;

    this.control = new ShaderPass(this.edlMaterial);
  }

  enableEdlPass(): void {
    this.isEnabled = true;
    // this.composerInitService.isEnabled = false;
    this.composerInitService.control.addPass(this.control);
    console.log('EDL Pass enabled');
  }
  disableEdlPass(): void {
    this.isEnabled = false;
    // this.composerInitService.isEnabled = true;
    this.composerInitService.control.removePass(this.control);
    // this.composerInitService.control.passes.forEach((pass) => {
    //   pass.enabled = true;
    // });
    console.log('EDL Pass disabled');
  }

  updateEdlMaterialUniforms() {
    const uniforms = this.edlMaterial.uniforms;
    const size = this.renderInitService.control.getSize(new Vector2());

    uniforms.screenWidth.value = size.x;
    uniforms.screenHeight.value = size.y;

    const proj = this.cameraInitService.control.projectionMatrix;
    const projArray = new Float32Array(16);
    projArray.set(proj.elements);

    uniforms.uNear.value = this.cameraInitService.control.near;
    uniforms.uFar.value = this.cameraInitService.control.far;
    uniforms.uEDLColor.value = this.rtEDL.texture;
    uniforms.uEDLDepth.value = this.rtEDL.depthTexture;
    uniforms.uProj.value = projArray;

    uniforms.edlStrength.value = 1;
    uniforms.radius.value = 1;
    uniforms.opacity.value = 1; // HACK
  }

  render(): void {
    if (!this.isEnabled) {
      return;
    }
    this.cameraInitService.control.updateMatrixWorld();
    this.renderInitService.control.setRenderTarget(this.rtEDL);
    this.renderInitService.control.clear();
    this.renderInitService.control.render(
      this.sceneInitService.control,
      this.cameraInitService.control
    );
    this.updateEdlMaterialUniforms();
    this.renderInitService.control.setRenderTarget(null);
    this.renderInitService.control.clear();
    this.renderInitService.control.clearDepth();
    this.composerInitService.renderEdl(this.control);
  }
}
