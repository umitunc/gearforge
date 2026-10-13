import { GearMeshZone } from './GearTypes';

/**
 * 2 Boyutlu Kartezyen nokta
 */
export interface Point2D {
  readonly x: number;
  readonly y: number;
}

/**
 * 2 Boyutlu kapalı çokgen profil (Saat yönünün tersi - CCW dış sınır veya CW iç delik)
 */
export type PolygonLoop2D = readonly Point2D[];

/**
 * 3D Yazıcı (Manifold/Watertight) doğrulama raporu
 */
export interface ManifoldReport {
  readonly isWatertight: boolean;
  readonly vertexCount: number;
  readonly triangleCount: number;
  readonly surfaceAreaMm2: number;
  readonly volumeMm3: number;
}

/**
 * Three.js BufferGeometry grup tanımı (Bölgesel 3B Highlight için)
 */
export interface MeshZoneGroup {
  readonly zone: GearMeshZone;
  readonly start: number; // İndeks dizisindeki başlangıç ofseti
  readonly count: number; // İndeks sayısı (üçgen sayısı * 3)
}

/**
 * Üretilen 3B ağ (Mesh) veri yapısı - Three.js BufferGeometry ve İhracatçılar için bağımsız DTO
 */
export interface GearMeshData {
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly indices: Uint32Array;
  readonly zoneGroups: readonly MeshZoneGroup[];
  readonly manifoldReport: ManifoldReport;
}
