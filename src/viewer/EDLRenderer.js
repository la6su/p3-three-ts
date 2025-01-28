import * as THREE from "three";
import { PointCloudSM } from "../utils/PointCloudSM.js";
import { EyeDomeLightingMaterial } from "../materials/EyeDomeLightingMaterial.js";
import { SphereVolume } from "../utils/Volume.js";

const screenPass = new function () {
	this.screenScene = new THREE.Scene();
	this.screenQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2, 1));
	this.screenQuad.material.depthTest = true;
	this.screenQuad.material.depthWrite = true;
	this.screenQuad.material.transparent = true;
	this.screenScene.add(this.screenQuad);
	this.camera = new THREE.Camera();

	this.render = function (renderer, material, target) {
		this.screenQuad.material = material;

		if (typeof target === 'undefined') {
			renderer.render(this.screenScene, this.camera);
		} else {
			renderer.render(this.screenScene, this.camera, target);
		}
	};
}();

export class EDLRenderer {
	constructor(viewer) {
		this.viewer = viewer;

		this.edlMaterial = null;

		this.rtRegular;
		this.rtEDL;
		if (!this.viewer.renderer) {
			throw new Error("viewer.renderer не инициализирован");
		}
		this.shadowMap = new PointCloudSM(this.viewer.renderer);
	}

	initEDL() {
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
			depthTexture: new THREE.DepthTexture(undefined, undefined, THREE.UnsignedIntType)
		});

		this.rtRegular = new THREE.WebGLRenderTarget(1024, 1024, {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat,
			depthTexture: new THREE.DepthTexture(undefined, undefined, THREE.UnsignedIntType)
		});
	};

	resize(width, height) {
		this.rtEDL.setSize(width, height);
		this.rtRegular.setSize(width, height);
	}

	clearTargets() {
		const viewer = this.viewer;
		const { renderer } = viewer;

		const oldTarget = renderer.getRenderTarget();

		renderer.setRenderTarget(this.rtEDL);
		renderer.clear(true, true, true);

		renderer.setRenderTarget(this.rtRegular);
		renderer.clear(true, true, false);

		renderer.setRenderTarget(oldTarget);
	}

	clear() {
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

	renderShadowMap(visiblePointClouds, camera, lights) {
		const { viewer } = this;

		const doShadows = lights.length > 0 && !(lights[0].disableShadowUpdates);
		if (doShadows) {
			let light = lights[0];

			this.shadowMap.setLight(light);

			let originalAttributes = new Map();
			for (let pointcloud of viewer.scene.pointClouds) {
				originalAttributes.set(pointcloud, pointcloud.material.activeAttributeName);
				pointcloud.material.activeAttributeName = "depth";
			}

			this.shadowMap.render(viewer.scene.scenePointCloud, camera);

			for (let pointcloud of visiblePointClouds) {
				let originalAttribute = originalAttributes.get(pointcloud);
				pointcloud.material.activeAttributeName = originalAttribute;
			}

			viewer.shadowTestCam.updateMatrixWorld();
			viewer.shadowTestCam.matrixWorldInverse.copy(viewer.shadowTestCam.matrixWorld).invert();
			viewer.shadowTestCam.updateProjectionMatrix();
		}
	}

	render(params) {
		this.initEDL();

		const viewer = this.viewer;
		let camera = params.camera ? params.camera : viewer.camera;
		const { width, height } = this.viewer.renderer.getSize(new THREE.Vector2());

		this.resize(width, height);


		console.log('Viewer Scene:', viewer.scene);
		const pointClouds = viewer.scene.pointClouds;
		if (!pointClouds) {
			console.error('pointClouds is not defined');
			return [];
		}
		const visiblePointClouds = pointClouds.filter(pc => pc.visible);
		console.log('Visible Point Clouds:', visiblePointClouds);

		let lights = [];
		viewer.scene.traverse(node => {
			if (node.type === "SpotLight") {
				lights.push(node);
			}
		});
		console.log('Lights:', lights);


		if (viewer.background === "skybox") {
			viewer.skybox.camera.rotation.copy(viewer.scene.cameraP.rotation);
			viewer.skybox.camera.fov = viewer.scene.cameraP.fov;
			viewer.skybox.camera.aspect = viewer.scene.cameraP.aspect;

			viewer.skybox.parent.rotation.x = 0;
			viewer.skybox.parent.updateMatrixWorld();

			viewer.skybox.camera.updateProjectionMatrix();
			viewer.renderer.render(viewer.skybox.scene, viewer.skybox.camera);
		} else if (viewer.background === 'gradient') {
			viewer.renderer.render(viewer.scene.sceneBG, viewer.scene.cameraBG);
		}

		this.renderShadowMap(visiblePointClouds, camera, lights);
		{ // COLOR & DEPTH PASS
			for (let pointcloud of visiblePointClouds) {
				let octreeSize = pointcloud.pcoGeometry.boundingBox.getSize(new THREE.Vector3()).x;

				let material = pointcloud.material;
				material.weighted = false;
				material.useLogarithmicDepthBuffer = false;
				material.useEDL = true;

				material.screenWidth = width;
				material.screenHeight = height;
				material.uniforms.visibleNodes.value = pointcloud.material.visibleNodesTexture;
				material.uniforms.octreeSize.value = octreeSize;
				material.spacing = pointcloud.pcoGeometry.spacing;
			}

			viewer.renderer.setRenderTarget(this.rtEDL);

			if (lights.length > 0) {
				viewer.renderer.render(viewer.scene.scenePointCloud, camera, this.rtEDL, {
					clipSpheres: viewer.scene.volumes.filter(v => (v instanceof SphereVolume)),
					shadowMaps: [this.shadowMap],
					transparent: false,
				});
			} else {
				viewer.renderer.render(viewer.scene.scenePointCloud, camera, this.rtEDL, {
					clipSpheres: viewer.scene.volumes.filter(v => (v instanceof SphereVolume)),
					transparent: false,
				});
			}
		}

		viewer.renderer.setRenderTarget(null);
		viewer.renderer.render(viewer.scene, camera);

		{ // EDL PASS
			const uniforms = this.edlMaterial.uniforms;

			uniforms.screenWidth.value = width;
			uniforms.screenHeight.value = height;

			let proj = camera.projectionMatrix;
			let projArray = new Float32Array(16);
			projArray.set(proj.elements);

			uniforms.uNear.value = camera.near;
			uniforms.uFar.value = camera.far;
			uniforms.uEDLColor.value = this.rtEDL.texture;
			uniforms.uEDLDepth.value = this.rtEDL.depthTexture;
			uniforms.uProj.value = projArray;

			uniforms.edlStrength.value = viewer.edlStrength;
			uniforms.radius.value = viewer.edlRadius;
			uniforms.opacity.value = viewer.edlOpacity;

			screenPass.render(viewer.renderer, this.edlMaterial);
		}

		viewer.renderer.clearDepth();

		viewer.transformationTool.update();

		viewer.renderer.render(viewer.controls.sceneControls, camera);
		viewer.renderer.render(viewer.clippingTool.sceneVolume, camera);
		viewer.renderer.render(viewer.transformationTool.scene, camera);
	}
}
