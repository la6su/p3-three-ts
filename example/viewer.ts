import {
  PerspectiveCamera,
  Scene,
  RawShaderMaterial,
  WebGLRenderer,
  WebGLRenderTarget,
  BoxGeometry,
  Mesh,
  MeshPhongMaterial,
  Camera, BufferGeometry, Material,
} from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { PointCloudMaterial, PointCloudOctree, PointCloudOctreeNode, Potree } from '../src'
// import { EdlPassInitService } from '../src/viewer/EDLPass-init-service';
import { ComposerInitService } from '../src/inits/composer-init.service';

PointCloudMaterial.makeOnBeforeRender = function (
  octree: PointCloudOctree,
  node: PointCloudOctreeNode,
  pcIndex?: number
) {
  return (
    _renderer: WebGLRenderer,
    _scene: Scene,
    _camera: Camera,
    _geometry: BufferGeometry,
    material: Material
  ) => {
    const pointCloudMaterial =
      material instanceof PointCloudMaterial ? material : octree.material;
    const materialUniforms = pointCloudMaterial.uniforms;

    materialUniforms.level.value = node.level;
    materialUniforms.isLeafNode.value = node.isLeafNode;

    // @ts-ignore
    const vnStart = pointCloudMaterial.visibleNodeTextureOffsets.get(node.name);
    if (vnStart !== undefined) {
      materialUniforms.vnStart.value = vnStart;
    }

    materialUniforms.pcIndex.value =
      pcIndex !== undefined ? pcIndex : octree.visibleNodes.indexOf(node);

    // Remove the cast to any after updating to Three.JS >= r113
    (material as RawShaderMaterial).uniformsNeedUpdate = true;
  };
};

export class Viewer {
  private static instance: Viewer;
  private composerInitService: ComposerInitService
  private targetEl: HTMLElement | undefined;
  readonly renderer: WebGLRenderer;
  sceneRenderTarget: WebGLRenderTarget | null;
  // private edlRenderer: EdlPassInitService | null;
  scene: Scene;
  camera: PerspectiveCamera;
  cameraControls: any;
  private potree_v1: Potree;


  private pointClouds: PointCloudOctree[];
  private prevTime: number | undefined;

  useEDL: boolean;
  edlStrength: number;
  edlOpacity: number;
  edlRadius: number;

  private constructor() {
    this.composerInitService = new ComposerInitService();
    this.edlStrength = 1.0;
    this.edlOpacity = 1.0;
    this.edlRadius = 1.4;
    this.useEDL = false;
    // this.edlRenderer = new EdlPassInitService();
    this.scene = new Scene();

    this.renderer = new WebGLRenderer();
    this.sceneRenderTarget = null;

    this.prevTime = undefined;
    this.potree_v1 = new Potree('v1');

    this.pointClouds = [];
    this.camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000); // Инициализация camera


    this.loop = this.loop.bind(this);
  }

  public static getInstance(): Viewer {
    if (!Viewer.instance) {
      Viewer.instance = new Viewer();
    }
    return Viewer.instance;
  }

  setEDLEnabled(value: boolean) {
    if (value) {
      // this.edlRenderer.enableEdlPass(); // Включение EDL Pass
    } else {
      // this.edlRenderer.disableEdlPass(); // Отключение EDL Pass
    }
  }

  initialize(targetEl: HTMLElement): void {
    if (this.targetEl || !targetEl) {
      return;
    }
    this.composerInitService.initialize(targetEl);
    this.targetEl = targetEl;
    targetEl.appendChild(this.renderer.domElement);
    this.cameraControls = new OrbitControls(this.camera, this.targetEl);

    // This is the render target that the initial rendering of scene will be:
    // opaque, transparent and point cloud buckets render into this.

    const geometry = new BoxGeometry(1.5, 1.5, 1.5);
    const material = new MeshPhongMaterial({ color: 0x00ff00 });
    const cube = new Mesh(geometry, material);
    cube.position.set(-1.5, -1.5, 0);
    cube.name = 'myCube';

    cube.receiveShadow = true;
    cube.castShadow = true;
    this.scene.add(cube);

    this.resize();
    window.addEventListener('resize', this.resize);

    requestAnimationFrame(this.loop);
  }

  load(fileName: string, baseUrl: string): Promise<PointCloudOctree> {
    return this.potree_v1.loadPointCloud(fileName, (url: string) => `${baseUrl}${url}`);
  }

  add(pco: PointCloudOctree): void {
    this.scene.add(pco);
    this.pointClouds.push(pco);
  }

  disposePointCloud(pointCloud: PointCloudOctree): void {
    this.scene.remove(pointCloud);
    pointCloud.dispose();
    this.pointClouds = this.pointClouds.filter(pco => pco !== pointCloud);
  }

  update(_: number): void {
    this.cameraControls.update();
    this.potree_v1.updatePointClouds(this.pointClouds, this.camera, this.renderer);

  }

  render(): void {

      // this.renderer.clear();
      // this.renderer.render(this.scene, this.camera);
      this.composerInitService.render();
  }

  loop = (time: number): void => {
    requestAnimationFrame(this.loop);

    const prevTime = this.prevTime;
    this.prevTime = time;
    if (prevTime === undefined) {
      return;
    }

    this.update(time - prevTime);
    this.render();
  };

  resize = () => {
    if (!this.targetEl) {
      return;
    }

    const { width, height } = this.targetEl.getBoundingClientRect();
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    //this.composerInitService.effectComposer.setSize(width, height);
  };



}
