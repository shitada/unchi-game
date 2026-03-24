import * as THREE from 'three';

export class FireworkEffect {
  private particleGroups: {
    points: THREE.Points;
    velocities: Float32Array;
    lifetimes: Float32Array;
    count: number;
  }[] = [];

  constructor(private scene: THREE.Scene) {}

  launch(): void {
    const count = 80;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);

    const cx = (Math.random() - 0.5) * 4;
    const cy = 2 + Math.random() * 2;
    const cz = -2 + Math.random();

    const hue = Math.random();
    const color = new THREE.Color().setHSL(hue, 1, 0.6);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = cx;
      positions[i3 + 1] = cy;
      positions[i3 + 2] = cz;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 2 + Math.random() * 3;
      velocities[i3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      velocities[i3 + 2] = Math.cos(phi) * speed;

      const c = new THREE.Color().setHSL(hue + (Math.random() - 0.5) * 0.1, 1, 0.5 + Math.random() * 0.3);
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      lifetimes[i] = 1 + Math.random() * 0.5;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    });

    const points = new THREE.Points(geo, mat);
    this.scene.add(points);
    this.particleGroups.push({ points, velocities, lifetimes, count });
  }

  update(dt: number): void {
    for (let g = this.particleGroups.length - 1; g >= 0; g--) {
      const group = this.particleGroups[g];
      const positions = group.points.geometry.attributes.position.array as Float32Array;
      let alive = false;

      for (let i = 0; i < group.count; i++) {
        group.lifetimes[i] -= dt;
        if (group.lifetimes[i] <= 0) continue;
        alive = true;

        const i3 = i * 3;
        positions[i3] += group.velocities[i3] * dt;
        positions[i3 + 1] += group.velocities[i3 + 1] * dt;
        positions[i3 + 2] += group.velocities[i3 + 2] * dt;
        group.velocities[i3 + 1] -= 4 * dt; // gravity
      }

      group.points.geometry.attributes.position.needsUpdate = true;
      (group.points.material as THREE.PointsMaterial).opacity = alive ? 1 : 0;

      if (!alive) {
        this.scene.remove(group.points);
        group.points.geometry.dispose();
        (group.points.material as THREE.Material).dispose();
        this.particleGroups.splice(g, 1);
      }
    }
  }

  dispose(): void {
    for (const group of this.particleGroups) {
      this.scene.remove(group.points);
      group.points.geometry.dispose();
      (group.points.material as THREE.Material).dispose();
    }
    this.particleGroups = [];
  }
}
