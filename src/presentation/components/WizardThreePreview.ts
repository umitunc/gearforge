import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GearParameters } from '../../domain/models/GearParameters';
import { ManifoldGearMeshBuilder } from '../../domain/mesh/ManifoldGearMeshBuilder';
import { GearMeshData } from '../../domain/models/GeometryTypes';
import { InvoluteMathCalculator } from '../../domain/calculators/InvoluteMathCalculator';

/**
 * Dişli Tasarım Sihirbazı için Kalıcı, Yüksek Performanslı 3B Three.js Önizleme Bileşeni.
 * Sihirbazdaki tüm adımlarda (Step 1-5) sabit olarak 3B modeli canlı render eder,
 * OrbitControls ile döndürme, yakınlaştırma ve otomatik dönüş sağlar.
 */
export class WizardThreePreview {
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly controls: OrbitControls;
  private readonly gearGroup: THREE.Group;
  private readonly gridGroup: THREE.Group;
  private readonly meshBuilder: ManifoldGearMeshBuilder;

  private primaryMesh: THREE.Mesh | null = null;
  private primaryWireframe: THREE.LineSegments | null = null;
  private zoneMaterials: THREE.MeshStandardMaterial[];
  private wireframeMaterial: THREE.LineBasicMaterial;

  private animationFrameId: number | null = null;
  private autoRotate = true;
  private showWireframe = false;
  private isUserInteracting = false;
  private currentParams: GearParameters | null = null;
  private container: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    this.meshBuilder = new ManifoldGearMeshBuilder();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060c18);

    // CAD Koordinat Sistemi: Z yukarı (Z-up)
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.5, 2000);
    this.camera.up.set(0, 0, 1);
    this.camera.position.set(0, -95, 75);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxDistance = 600;
    this.controls.minDistance = 6;
    this.controls.target.set(0, 0, 0);

    this.controls.addEventListener('start', () => {
      this.isUserInteracting = true;
    });
    this.controls.addEventListener('end', () => {
      this.isUserInteracting = false;
    });

    // Gruplar
    this.gridGroup = new THREE.Group();
    this.gearGroup = new THREE.Group();
    this.scene.add(this.gridGroup);
    this.scene.add(this.gearGroup);

    // 4 Bölge Materyali (Tooth Flank, Rim, Web, Bore) - Yüksek kaliteli PBR metalik / ipeksi kaplama
    this.zoneMaterials = [
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8, // Diş Evident / Flank: Canlı açık mavi
        metalness: 0.28,
        roughness: 0.32,
        side: THREE.DoubleSide,
      }),
      new THREE.MeshStandardMaterial({
        color: 0x0284c7, // Çember / Rim: Derin mavi
        metalness: 0.32,
        roughness: 0.35,
        side: THREE.DoubleSide,
      }),
      new THREE.MeshStandardMaterial({
        color: 0x0369a1, // Web / Gövde: Çelik koyu mavi
        metalness: 0.35,
        roughness: 0.4,
        side: THREE.DoubleSide,
      }),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8, // Delik / Bore: Kontrast açık mavi
        metalness: 0.4,
        roughness: 0.25,
        side: THREE.DoubleSide,
      }),
    ];

    this.wireframeMaterial = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.3,
    });

    this.setupLighting();
    this.setupBuildGrid();
    this.startLoop();
  }

  /**
   * Stüdyo Işıklandırma Kurulumu
   */
  private setupLighting(): void {
    // Ortam Işığı
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambientLight);

    // Ana Yönlü Işık (Key Light)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(70, -90, 130);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0001;
    this.scene.add(keyLight);

    // Dolgu Işığı (Fill / Rim Light)
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    fillLight.position.set(-80, 70, 60);
    this.scene.add(fillLight);

    // Alt Yansıma Işığı
    const bounceLight = new THREE.DirectionalLight(0x0284c7, 0.5);
    bounceLight.position.set(0, 0, -60);
    this.scene.add(bounceLight);
  }

  /**
   * Zemin Izgarası (Build Grid Platform)
   */
  private setupBuildGrid(): void {
    const gridHelper = new THREE.GridHelper(180, 18, 0x1e293b, 0x0f172a);
    gridHelper.rotation.x = Math.PI / 2; // Z-up uyumlu
    gridHelper.position.z = -0.1;
    this.gridGroup.add(gridHelper);

    // Dairesel referans çemberi
    const circleCurve = new THREE.EllipseCurve(0, 0, 50, 50, 0, 2 * Math.PI, false, 0);
    const circlePoints = circleCurve.getPoints(64);
    const circleGeo = new THREE.BufferGeometry().setFromPoints(
      circlePoints.map((p) => new THREE.Vector3(p.x, p.y, 0))
    );
    const circleMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.15,
    });
    const circleLine = new THREE.Line(circleGeo, circleMat);
    this.gridGroup.add(circleLine);
  }

  /**
   * DOM Konteynerine bağlar. Konteyner değiştiğinde WebGL contextini kaybetmeden taşır.
   */
  public attachTo(container: HTMLElement): void {
    if (this.container === container && container.contains(this.renderer.domElement)) {
      this.resize();
      return;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    this.container = container;
    container.appendChild(this.renderer.domElement);

    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
    });
    this.resizeObserver.observe(container);

    this.resize();
  }

  /**
   * Boyutlandırma ve kamera en-boy oranı güncellemesi
   */
  public resize(): void {
    if (!this.container) return;
    const w = this.container.clientWidth || 380;
    const h = this.container.clientHeight || 240;

    if (w === 0 || h === 0) return;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  /**
   * Dişli parametrelerini alıp 3B modeli yeniden oluşturur.
   */
  public update(params: GearParameters): void {
    this.currentParams = params;

    try {
      const meshData = this.meshBuilder.build(params);
      this.rebuildMesh(meshData, params);
    } catch (err) {
      console.warn('[WizardThreePreview] 3B model oluşturma hatası:', err);
    }
  }

  /**
   * BufferGeometry oluşturup sahnedeki mevcudu günceller.
   */
  private rebuildMesh(meshData: GearMeshData, params: GearParameters): void {
    // Eski geometrileri temizle
    if (this.primaryMesh) {
      this.gearGroup.remove(this.primaryMesh);
      this.primaryMesh.geometry.dispose();
      this.primaryMesh = null;
    }
    if (this.primaryWireframe) {
      this.gearGroup.remove(this.primaryWireframe);
      this.primaryWireframe.geometry.dispose();
      this.primaryWireframe = null;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(meshData.positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(meshData.normals, 3));
    geo.setIndex(new THREE.BufferAttribute(meshData.indices, 1));

    for (const group of meshData.zoneGroups) {
      if (group.count > 0) {
        geo.addGroup(group.start, group.count, group.zone);
      }
    }

    this.primaryMesh = new THREE.Mesh(geo, this.zoneMaterials);
    this.primaryMesh.castShadow = true;
    this.primaryMesh.receiveShadow = true;
    this.gearGroup.add(this.primaryMesh);

    const wireGeo = new THREE.WireframeGeometry(geo);
    this.primaryWireframe = new THREE.LineSegments(wireGeo, this.wireframeMaterial);
    this.primaryWireframe.visible = this.showWireframe;
    this.gearGroup.add(this.primaryWireframe);

    // Dişlinin Z tabanını 0 noktasına oturt
    const thickness = params.thickness || 10;
    this.gridGroup.position.z = 0;
    this.controls.target.set(0, 0, thickness / 2);
  }

  /**
   * Kamerayı dişli boyutuna göre otomatik odaklar.
   */
  public frameCamera(): void {
    if (!this.currentParams) return;
    const radii = InvoluteMathCalculator.calculateRadii(this.currentParams);
    const radius = Math.max(radii.outerRadius, 15);
    const thickness = this.currentParams.thickness || 10;

    const dist = Math.max(radius * 2.5, 45);
    this.camera.position.set(0, -dist * 0.95, dist * 0.85);
    this.camera.lookAt(0, 0, thickness / 2);
    this.controls.target.set(0, 0, thickness / 2);
    this.controls.update();
  }

  /**
   * Otomatik dönüşü açar/kapatır.
   */
  public toggleAutoRotate(): boolean {
    this.autoRotate = !this.autoRotate;
    return this.autoRotate;
  }

  public isAutoRotating(): boolean {
    return this.autoRotate;
  }

  /**
   * Tel kafes modunu açar/kapatır.
   */
  public toggleWireframe(): boolean {
    this.showWireframe = !this.showWireframe;
    if (this.primaryWireframe) {
      this.primaryWireframe.visible = this.showWireframe;
    }
    return this.showWireframe;
  }

  public isWireframeActive(): boolean {
    return this.showWireframe;
  }

  /**
   * Render döngüsü
   */
  private startLoop(): void {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      // Kullanıcı fareyle müdahale etmiyorken ve autoRotate aktifken dişliyi yavaşça döndür
      if (this.autoRotate && !this.isUserInteracting && this.gearGroup) {
        this.gearGroup.rotation.z += 0.007;
      }

      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  /**
   * Temizlik ve bellek boşaltma
   */
  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.controls.dispose();

    if (this.primaryMesh) {
      this.primaryMesh.geometry.dispose();
    }
    if (this.primaryWireframe) {
      this.primaryWireframe.geometry.dispose();
    }

    for (const mat of this.zoneMaterials) {
      mat.dispose();
    }
    this.wireframeMaterial.dispose();

    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
