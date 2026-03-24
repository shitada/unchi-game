import * as THREE from 'three';
import type { PoopId } from '@/types';
import { POOP_ENCYCLOPEDIA } from '@/game/config/PoopEncyclopedia';

/**
 * Procedurally generates 3D poop models for each PoopId.
 * All models are centered at origin and roughly normalized in size.
 */
export class PoopModelBuilder {
  static build(id: PoopId, scale = 1): THREE.Group {
    const group = new THREE.Group();
    const entry = POOP_ENCYCLOPEDIA[id];

    switch (id) {
      case 'normal':  this.buildNormal(group, entry.color); break;
      case 'tiny':    this.buildTiny(group, entry.color); break;
      case 'long':    this.buildLong(group, entry.color); break;
      case 'thick':   this.buildThick(group, entry.color); break;
      case 'softServe': this.buildSoftServe(group, entry.color, entry.secondaryColor!); break;
      case 'pebble':  this.buildPebble(group, entry.color); break;
      case 'fluffy':  this.buildFluffy(group, entry.color); break;
      case 'rainbow': this.buildRainbow(group); break;
      case 'golden':  this.buildGolden(group, entry.color, entry.secondaryColor!); break;
      case 'star':    this.buildStar(group, entry.color, entry.secondaryColor!); break;
    }

    group.scale.setScalar(scale);
    return group;
  }

  /** Classic 3-tier coil poop 💩 */
  private static buildNormal(group: THREE.Group, color: number): void {
    const mat = new THREE.MeshToonMaterial({ color });
    // Stack 3 torus shapes (coils) getting smaller toward top
    const tiers = [
      { radius: 0.6, y: 0 },
      { radius: 0.45, y: 0.35 },
      { radius: 0.3, y: 0.65 },
    ];
    for (const tier of tiers) {
      const geo = new THREE.TorusGeometry(tier.radius, 0.18, 12, 24);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = tier.y;
      mesh.rotation.x = Math.PI / 2;
      group.add(mesh);
    }
    // Top point
    const tipGeo = new THREE.SphereGeometry(0.15, 12, 8);
    const tip = new THREE.Mesh(tipGeo, mat);
    tip.position.set(0, 0.9, 0);
    group.add(tip);
  }

  /** Small single ball */
  private static buildTiny(group: THREE.Group, color: number): void {
    const mat = new THREE.MeshToonMaterial({ color });
    const geo = new THREE.SphereGeometry(0.3, 16, 12);
    const mesh = new THREE.Mesh(geo, mat);
    // Slight squash
    mesh.scale.set(1, 0.8, 1);
    group.add(mesh);
  }

  /** Long snake-like poop */
  private static buildLong(group: THREE.Group, color: number): void {
    const mat = new THREE.MeshToonMaterial({ color });
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.3, 0.3, 0),
      new THREE.Vector3(-0.2, 0.7, 0.1),
      new THREE.Vector3(0.1, 1.1, -0.1),
      new THREE.Vector3(-0.1, 1.5, 0),
      new THREE.Vector3(0.05, 1.8, 0.05),
    ]);
    const geo = new THREE.TubeGeometry(path, 32, 0.15, 12, false);
    const mesh = new THREE.Mesh(geo, mat);
    // Taper the end using morph or scale — simple approach: add a tip
    group.add(mesh);
    const tipGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const tip = new THREE.Mesh(tipGeo, mat);
    tip.position.copy(path.getPointAt(1));
    group.add(tip);
  }

  /** Short and wide poop */
  private static buildThick(group: THREE.Group, color: number): void {
    const mat = new THREE.MeshToonMaterial({ color });
    // Use lathe geometry for a fat profile
    const points: THREE.Vector2[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const r = 0.5 * Math.sin(t * Math.PI) * (1 + 0.3 * Math.sin(t * Math.PI * 3));
      points.push(new THREE.Vector2(r, t * 0.7));
    }
    const geo = new THREE.LatheGeometry(points, 24);
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);
  }

  /** Soft-serve ice cream spiral */
  private static buildSoftServe(group: THREE.Group, color1: number, color2: number): void {
    const mat1 = new THREE.MeshToonMaterial({ color: color1 });
    const mat2 = new THREE.MeshToonMaterial({ color: color2 });

    // Cone base
    const coneGeo = new THREE.ConeGeometry(0.35, 0.4, 16);
    const cone = new THREE.Mesh(coneGeo, mat2);
    cone.position.y = -0.1;
    group.add(cone);

    // Spiral coils stacking up
    for (let i = 0; i < 5; i++) {
      const radius = 0.35 - i * 0.05;
      const geo = new THREE.TorusGeometry(radius, 0.1, 10, 20);
      const mesh = new THREE.Mesh(geo, i % 2 === 0 ? mat1 : mat2);
      mesh.position.y = 0.15 + i * 0.18;
      mesh.rotation.x = Math.PI / 2;
      group.add(mesh);
    }

    // Tip
    const tipGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const tip = new THREE.Mesh(tipGeo, mat1);
    tip.position.set(0, 1.1, 0);
    group.add(tip);
  }

  /** Multiple small round pellets */
  private static buildPebble(group: THREE.Group, color: number): void {
    const mat = new THREE.MeshToonMaterial({ color });
    const positions = [
      [0, 0, 0], [-0.3, 0, 0.2], [0.3, 0, -0.1],
      [0.1, 0, 0.3], [-0.15, 0.15, 0], [0.2, 0.12, 0.15],
      [-0.1, 0.1, -0.2], [0.05, 0.25, 0.05],
    ];
    for (const [x, y, z] of positions) {
      const size = 0.1 + Math.random() * 0.08;
      const geo = new THREE.SphereGeometry(size, 8, 6);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.scale.set(1, 0.85, 1);
      group.add(mesh);
    }
  }

  /** Fluffy cloud-like poop */
  private static buildFluffy(group: THREE.Group, color: number): void {
    const mat = new THREE.MeshToonMaterial({ color });
    // Cluster of overlapping spheres
    const blobs = [
      { x: 0, y: 0, z: 0, r: 0.35 },
      { x: 0.25, y: 0.1, z: 0.15, r: 0.28 },
      { x: -0.25, y: 0.08, z: 0.1, r: 0.3 },
      { x: 0.1, y: 0.25, z: -0.1, r: 0.25 },
      { x: -0.1, y: 0.3, z: 0.05, r: 0.22 },
      { x: 0, y: 0.45, z: 0, r: 0.18 },
    ];
    for (const b of blobs) {
      const geo = new THREE.SphereGeometry(b.r, 12, 10);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.x, b.y, b.z);
      group.add(mesh);
    }
  }

  /** Rainbow-colored coil poop */
  private static buildRainbow(group: THREE.Group): void {
    const colors = [0xFF0000, 0xFF8800, 0xFFFF00, 0x00CC00, 0x0088FF, 0x8800FF];
    const tiers = [
      { radius: 0.55, y: 0 },
      { radius: 0.45, y: 0.3 },
      { radius: 0.35, y: 0.55 },
      { radius: 0.25, y: 0.75 },
      { radius: 0.18, y: 0.9 },
      { radius: 0.1, y: 1.0 },
    ];
    for (let i = 0; i < tiers.length; i++) {
      const mat = new THREE.MeshToonMaterial({ color: colors[i % colors.length] });
      const tier = tiers[i];
      if (i < tiers.length - 1) {
        const geo = new THREE.TorusGeometry(tier.radius, 0.14, 10, 20);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = tier.y;
        mesh.rotation.x = Math.PI / 2;
        group.add(mesh);
      } else {
        const geo = new THREE.SphereGeometry(0.1, 8, 8);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = tier.y;
        group.add(mesh);
      }
    }
  }

  /** Golden shiny poop */
  private static buildGolden(group: THREE.Group, color: number, secondary: number): void {
    const mat = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.8,
      roughness: 0.2,
      emissive: secondary,
      emissiveIntensity: 0.3,
    });

    // Similar to normal but with golden material
    const tiers = [
      { radius: 0.55, y: 0 },
      { radius: 0.4, y: 0.32 },
      { radius: 0.28, y: 0.58 },
    ];
    for (const tier of tiers) {
      const geo = new THREE.TorusGeometry(tier.radius, 0.16, 12, 24);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = tier.y;
      mesh.rotation.x = Math.PI / 2;
      group.add(mesh);
    }
    const tipGeo = new THREE.SphereGeometry(0.13, 12, 8);
    const tip = new THREE.Mesh(tipGeo, mat);
    tip.position.set(0, 0.82, 0);
    group.add(tip);
  }

  /** Star-shaped legendary poop */
  private static buildStar(group: THREE.Group, color: number, secondary: number): void {
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: secondary,
      emissiveIntensity: 0.5,
      metalness: 0.3,
      roughness: 0.4,
    });

    // 5-pointed star using custom shape extruded
    const shape = new THREE.Shape();
    const outerR = 0.6;
    const innerR = 0.25;
    for (let i = 0; i < 5; i++) {
      const outerAngle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const innerAngle = outerAngle + Math.PI / 5;
      const ox = Math.cos(outerAngle) * outerR;
      const oy = Math.sin(outerAngle) * outerR;
      const ix = Math.cos(innerAngle) * innerR;
      const iy = Math.sin(innerAngle) * innerR;
      if (i === 0) shape.moveTo(ox, oy);
      else shape.lineTo(ox, oy);
      shape.lineTo(ix, iy);
    }
    shape.closePath();

    const extrudeSettings = { depth: 0.3, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.15;
    group.add(mesh);

    // Add sparkle points
    const sparkleMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const sparkle = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.06),
        sparkleMat,
      );
      sparkle.position.set(
        Math.cos(angle) * 0.8,
        0.3,
        Math.sin(angle) * 0.8,
      );
      sparkle.userData.isSparkle = true;
      group.add(sparkle);
    }
  }

  /** Per-poop wiggle animation triggered on tap. Returns whether still active. */
  static wiggleModel(group: THREE.Group, id: PoopId, t: number, wiggleStart: number): { active: boolean } {
    const elapsed = t - wiggleStart;
    const duration = PoopModelBuilder.getWiggleDuration(id);
    if (elapsed > duration) {
      group.rotation.z = 0;
      group.position.x = 0;
      group.scale.set(1, 1, 1).multiplyScalar(group.userData.baseScale ?? 2);
      return { active: false };
    }
    const decay = 1 - elapsed / duration;

    switch (id) {
      case 'normal':
        group.rotation.z = Math.sin(elapsed * 25) * 0.2 * decay;
        break;
      case 'tiny':
        group.position.y = (group.userData.baseY ?? 0.3) + Math.abs(Math.sin(elapsed * 30)) * 0.3 * decay;
        group.scale.setScalar((group.userData.baseScale ?? 2) * (1 + Math.sin(elapsed * 20) * 0.15 * decay));
        break;
      case 'long':
        group.position.x = Math.sin(elapsed * 15) * 0.3 * decay;
        group.rotation.z = Math.sin(elapsed * 15 + 0.5) * 0.15 * decay;
        break;
      case 'thick': {
        const squash = 1 + Math.sin(elapsed * 12) * 0.2 * decay;
        const s = group.userData.baseScale ?? 2;
        group.scale.set(s * squash, s / squash, s * squash);
        break;
      }
      case 'softServe':
        group.rotation.y += 0.15 * decay;
        group.rotation.z = Math.sin(elapsed * 18) * 0.12 * decay;
        break;
      case 'pebble':
        group.position.x = Math.sin(elapsed * 35) * 0.15 * decay;
        group.position.y = (group.userData.baseY ?? 0.3) + Math.sin(elapsed * 40) * 0.1 * decay;
        break;
      case 'fluffy': {
        const pulse = 1 + Math.sin(elapsed * 10) * 0.2 * decay;
        group.scale.setScalar((group.userData.baseScale ?? 2) * pulse);
        break;
      }
      case 'rainbow':
        group.rotation.y += 0.3 * decay;
        group.rotation.z = Math.sin(elapsed * 20) * 0.15 * decay;
        group.rotation.x = Math.sin(elapsed * 15) * 0.1 * decay;
        break;
      case 'golden': {
        group.rotation.z = Math.sin(elapsed * 8) * 0.15 * decay;
        const gp = 1 + Math.sin(elapsed * 6) * 0.1 * decay;
        group.scale.setScalar((group.userData.baseScale ?? 2) * gp);
        break;
      }
      case 'star':
        group.rotation.y += 0.2 * decay;
        group.position.y = (group.userData.baseY ?? 0.3) + Math.sin(elapsed * 8) * 0.3 * decay;
        group.scale.setScalar((group.userData.baseScale ?? 2) * (1 + Math.sin(elapsed * 12) * 0.12 * decay));
        break;
    }
    return { active: true };
  }

  static getWiggleDuration(id: PoopId): number {
    switch (id) {
      case 'tiny': return 0.5;
      case 'long': return 0.8;
      case 'thick': return 0.6;
      case 'pebble': return 0.5;
      case 'softServe': return 0.7;
      case 'fluffy': return 0.6;
      case 'rainbow': return 0.8;
      case 'golden': return 1.0;
      case 'star': return 1.2;
      default: return 0.6;
    }
  }

  /** Animate sparkles / special effects on update */
  static animateModel(group: THREE.Group, id: PoopId, time: number): void {
    if (id === 'star') {
      group.children.forEach(child => {
        if (child.userData.isSparkle) {
          child.scale.setScalar(0.8 + 0.4 * Math.sin(time * 5 + child.position.x * 10));
          child.rotation.y = time * 3;
        }
      });
    }
    if (id === 'golden') {
      // Gentle pulse glow
      group.children.forEach(child => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.emissiveIntensity = 0.2 + 0.2 * Math.sin(time * 3);
        }
      });
    }
    if (id === 'rainbow') {
      // Rotate each tier slightly differently
      group.children.forEach((child, i) => {
        child.rotation.z = Math.sin(time * 2 + i * 0.5) * 0.1;
      });
    }
  }
}
