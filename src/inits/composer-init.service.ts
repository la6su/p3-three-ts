import {
  BlendFunction,
  EffectComposer, EffectPass, OutlineEffect,
  RenderPass, ShaderPass, SMAAEffect,
} from 'postprocessing'
import {
  Texture,
  DepthTexture,
  FloatType,
  HalfFloatType,
  NearestFilter,
  ShaderMaterial,
  WebGLRenderTarget,
  Raycaster, Vector2, Object3D,
} from 'three'
import { Viewer } from '../../example/viewer'
import { EDLRenderer } from '../viewer/EDLRenderer'

export class ComposerInitService {
  control!: EffectComposer;
  isEnabled!: boolean;

  private selectedObjects!: any[];
  private raycaster!: Raycaster;
  private mouse!: Vector2;

  private renderPass!: RenderPass;
  private edlRenderer: EDLRenderer | undefined;
  private targetEl!: HTMLElement
  private sceneRenderTarget!: WebGLRenderTarget<Texture>
  // private screenshot!: { target: WebGLRenderTarget<Texture> };
  effectComposer!: EffectComposer;
  outlineEffect?: OutlineEffect;
  // edlMaterial!: ShaderMaterial;
  useEDL!: boolean;
  edlStrength!: number;
  edlOpacity!: number;
  edlRadius!: number;

  initialize(targetEl: HTMLElement): void {
    // console.log('Initializing ComposerInitService...');
    const viewer = Viewer.getInstance();
    this.control = new EffectComposer(viewer.renderer, {
      frameBufferType: HalfFloatType,
      alpha: true,
    });

    this.renderPass = new RenderPass(viewer.scene, viewer.camera);
    this.control.addPass(this.renderPass);
    this.targetEl = targetEl;
    this.edlRenderer = new EDLRenderer(viewer);
    this.edlStrength = 1.0;
    this.edlOpacity = 1.0;
    this.edlRadius = 1.4;
    this.useEDL = true;

    this.selectedObjects = [];
    this.raycaster = new Raycaster();
    this.mouse = new Vector2();

    const { width, height } = this.targetEl.getBoundingClientRect();
    // This is the render target that the initial rendering of scene will be:
    // opaque, transparent and point cloud buckets render into this.
    this.sceneRenderTarget = new WebGLRenderTarget(width, height, {
      generateMipmaps: false,
      magFilter: NearestFilter,
      minFilter: NearestFilter,
      depthBuffer: true,
      samples: 4,
      depthTexture: new DepthTexture(width, height, FloatType),
    });
    this.control = new EffectComposer(viewer.renderer);
    this.control.setSize(width, height);
    // After the buckets have been rendered into the render target,
    // the effect composer will render this render target to the canvas.
    this.control.addPass(new ShaderPass(new ShaderMaterial({
      uniforms: {
        tDiffuse: {value: this.sceneRenderTarget.texture}
      },
      vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
      fragmentShader: `
                uniform sampler2D tDiffuse;
                varying vec2 vUv;
                void main() {
                    gl_FragColor = texture2D(tDiffuse, vUv);
                }
            `
    })));
    const renderPass = new RenderPass(viewer.scene, viewer.camera);
    this.control.addPass(renderPass);

    const smaaEffect = new SMAAEffect();
    this.outlineEffect = new OutlineEffect(viewer.scene, viewer.camera, {
      blendFunction: BlendFunction.ADD,
      multisampling: Math.min(4, viewer.renderer.capabilities.maxSamples),
      edgeStrength: 10,
      pulseSpeed: 0.0,
      visibleEdgeColor: 0xffffff,
      hiddenEdgeColor: 0x22090a,
      height: 480,
      blur: false,
      xRay: true
    });

    const outlinePass = new EffectPass(viewer.camera, this.outlineEffect);
    outlinePass.renderToScreen = true;
    this.control.addPass(outlinePass);
    const smaaPass = new EffectPass(viewer.camera, smaaEffect);
    this.control.addPass(smaaPass);
    // this.SMAAEffect.colorEdgesMaterial.setEdgeDetectionThreshold(0.1);
    // const effectPass = new EffectPass(
    //   this.cameraInitService.control,
    //   this.SMAAEffect
    // );

    // this.control.addPass(effectPass);

    this.isEnabled = true;


    viewer.renderer.domElement.style.touchAction = "none";
    viewer.renderer.domElement.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary) {
        return;
      }

      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      this.checkIntersection();
    });

  }

  setEDLEnabled (value:boolean) {
    value = Boolean(value);

    if (this.useEDL !== value) {
      this.useEDL = value;
      console.log(`EDL enabled: ${this.useEDL}`);
    }
  }

  render() {
    if (!this.isEnabled) {
      return;
    }

    if (this.useEDL && this.edlRenderer) {
     // console.log('Rendering with EDL...');
      this.edlRenderer.render({camera: Viewer.getInstance().camera});
    } else {
      // console.log('Rendering without EDL...');
      this.control.render();
    }
  }

 private addSelectedObject = (object: Object3D) => {
    this.selectedObjects = [];
    this.selectedObjects.push(object);
    if (this.outlineEffect) {
      this.outlineEffect['selection'].set(this.selectedObjects);
    }
  }

  private checkIntersection() {
    const viewer = Viewer.getInstance();
    this.raycaster.setFromCamera(this.mouse, viewer.camera);
    const myCube = viewer.scene.getObjectByName("myCube");
    if (!myCube) {
      console.error("myCube not found in the scene");
      return;
    }
    const intersects = this.raycaster.intersectObject(myCube, true);
    if (intersects.length > 0) {
      const selectedObject = intersects[0].object;
      if (selectedObject !== undefined) {
        this.addSelectedObject(selectedObject);
      }
    }
  }
}
