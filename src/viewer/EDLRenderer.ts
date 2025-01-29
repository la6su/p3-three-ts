import * as THREE from "three";
import { PointCloudSM } from "../utils/PointCloudSM.js";
import { EyeDomeLightingMaterial } from "../materials/EyeDomeLightingMaterial.js";
// import { SphereVolume } from "../utils/Volume.js";
import { Viewer } from "../../example/viewer";
import { Potree } from '../potree'
export class EDLRenderer {
	viewer: Viewer;
	edlMaterial: EyeDomeLightingMaterial | null;
	rtRegular: THREE.WebGLRenderTarget | null;
	rtEDL: THREE.WebGLRenderTarget | null;
	gl: WebGLRenderingContext;
	shadowMap: PointCloudSM;
	screenshot?: { target: THREE.WebGLRenderTarget };

	constructor(viewer: Viewer) {
		this.viewer = viewer;
		this.edlMaterial = null;
		this.rtRegular = null;
		this.rtEDL = null;
		this.gl = viewer.renderer.getContext();
		this.shadowMap = new PointCloudSM(this.viewer.renderer);
	}

	initEDL(): void {
		if (this.edlMaterial != null) {
			return;
		}
		this.edlMaterial = new EyeDomeLightingMaterial();
		this.edlMaterial.depthTest = true;
		this.edlMaterial.depthWrite = true;
		this.edlMaterial.transparent = true;

		this.rtEDL = new THREE.WebGLRenderTarget(1024, 1024, {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			depthTexture: new THREE.DepthTexture(1024, 1024, THREE.UnsignedIntType)
		});

		this.rtRegular = new THREE.WebGLRenderTarget(1024, 1024, {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat,
			depthTexture: new THREE.DepthTexture(1024, 1024, THREE.UnsignedIntType)
		});
	}

	resize(width: number, height: number): void {
		if (this.rtEDL && this.rtRegular) {
			this.rtEDL.setSize(width, height);
			this.rtRegular.setSize(width, height);
		}
	}

	clearTargets(): void {
		const viewer = this.viewer;
		const { renderer } = viewer;

		const oldTarget = renderer.getRenderTarget();

		if (this.rtEDL) {
			renderer.setRenderTarget(this.rtEDL);
			renderer.clear(true, true, true);
		}

		if (this.rtRegular) {
			renderer.setRenderTarget(this.rtRegular);
			renderer.clear(true, true, false);
		}

		renderer.setRenderTarget(oldTarget);
	}

	clear(): void {
		this.initEDL();
		const viewer = this.viewer;
		const { renderer, background } = viewer;

		if (background === "skybox") {
			renderer.setClearColor(0x000000, 0);
		} else if (background === 'gradient') {
			renderer.setClearColor(0x000000, 0);
		} else if (background === 'black') {
			renderer.setClearColor(0x000000, 1);
		} else if (background === 'white') {
			renderer.setClearColor(0xFFFFFF, 1);
		} else {
			renderer.setClearColor(0x000000, 0);
		}

		renderer.clear();
		this.clearTargets();
	}

	render(params: { camera?: THREE.Camera }): void {
		this.initEDL();

		const viewer = this.viewer;
		const camera = params.camera ? params.camera : viewer.camera;

		const { width, height } = this.viewer.renderer.getSize(new THREE.Vector2());

		this.resize(width, height);

		const pointClouds = viewer.pointClouds;
		if (!pointClouds) {
			return;
		}

		const visiblePointClouds = pointClouds.filter(pc => pc.visible);

		if (this.screenshot) {
			const oldBudget = (Potree as any).pointBudget;
			(Potree as any).pointBudget = Math.max(10 * 1000 * 1000, 2 * oldBudget);
			(Potree as any).updatePointClouds(viewer.pointClouds, camera, viewer.renderer);
			(Potree as any).pointBudget = oldBudget;
		}

		const lights: THREE.SpotLight[] = [];

		viewer.scene.traverse(node => {
			if (node instanceof THREE.SpotLight) {
				lights.push(node);
			}
		});

		// if (viewer.background === "skybox") {
		// 	viewer.skybox.camera.rotation.copy(viewer.scene.cameraP.rotation);
		// 	viewer.skybox.camera.fov = viewer.scene.cameraP.fov;
		// 	viewer.skybox.camera.aspect = viewer.scene.cameraP.aspect;
		//
		// 	viewer.skybox.parent.rotation.x = 0;
		// 	viewer.skybox.parent.updateMatrixWorld();
		//
		// 	viewer.skybox.camera.updateProjectionMatrix();
		// 	viewer.renderer.render(viewer.skybox.scene, viewer.skybox.camera);
		// } else if (viewer.background === 'gradient') {
		// 	viewer.renderer.render(viewer.scene.sceneBG, viewer.scene.cameraBG);
		// }

		// COLOR & DEPTH PASS
		for (const pointcloud of visiblePointClouds) {
			const octreeSize = pointcloud.pcoGeometry.boundingBox.getSize(new THREE.Vector3()).x;

			const material = pointcloud.material;
			material.weighted = false;
			// material.useLogarithmicDepthBuffer = false;
			material.useEDL = true;

			material.screenWidth = width;
			material.screenHeight = height;
			// material.uniforms.visibleNodes.value = pointcloud.material.visibleNodesTexture;
			material.uniforms.octreeSize.value = octreeSize;
			material.spacing = pointcloud.pcoGeometry.spacing;
		}

		if (this.rtEDL) {
			viewer.renderer.setRenderTarget(this.rtEDL);

			if (lights.length > 0) {
				viewer.renderer.render(viewer.scene, camera);
			} else {
				viewer.renderer.render(viewer.scene, camera);
			}
		}

		viewer.renderer.setRenderTarget(null);
		viewer.renderer.render(viewer.scene, camera);

		// EDL PASS
		if (this.edlMaterial) {
			const uniforms = this.edlMaterial.uniforms;

			uniforms.screenWidth.value = width;
			uniforms.screenHeight.value = height;

			const proj = camera.projectionMatrix;
			const projArray = new Float32Array(16);
			projArray.set(proj.elements);

			uniforms.uNear.value = viewer.camera.near;
			uniforms.uFar.value = viewer.camera.far;
			uniforms.uEDLColor.value = this.rtEDL?.texture;
			uniforms.uEDLDepth.value = this.rtEDL?.depthTexture;
			uniforms.uProj.value = projArray;

			uniforms.edlStrength.value = viewer.composerInitService.edlStrength;
			uniforms.radius.value = viewer.composerInitService.edlRadius;
			uniforms.opacity.value = viewer.composerInitService.edlOpacity;

			if (this.screenshot) {
				EDLRenderer.screenPass.render(viewer.renderer, this.edlMaterial, this.screenshot.target);
			}
		}

		viewer.renderer.clearDepth();

		//viewer.transformationTool.update();

		// viewer.dispatchEvent({ type: "render.pass.perspective_overlay", viewer: viewer });
		// viewer.renderer.render(viewer.controls.sceneControls, camera);
		// viewer.renderer.render(viewer.clippingTool.sceneVolume, camera);
		// viewer.renderer.render(viewer.transformationTool.scene, camera);

		//viewer.dispatchEvent({ type: "render.pass.end", viewer: viewer });
	}

	static screenPass = {
		screenScene: new THREE.Scene(),
		screenQuad: new THREE.Mesh(new THREE.PlaneGeometry(2, 2, 1)),
		camera: new THREE.Camera(),
		render(renderer: THREE.WebGLRenderer, material: THREE.Material, target?: THREE.WebGLRenderTarget): void {
			this.screenQuad.material = material;
			if (typeof target === 'undefined') {
				renderer.render(this.screenScene, this.camera);
			} else {
				renderer.render(this.screenScene, this.camera);
			}
		}
	};
}
