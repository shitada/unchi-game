import * as THREE from 'three';

export class PoopGrowEffect {
  private particles: THREE.Points | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private velocities: Float32Array | null = null;
  private lifetimes: Float32Array | null = null;
  private maxParticles = 50;
  private activeCount = 0;
  private elapsed = 0;

  constructor(private scene: THREE.Scene) {
    this.init();
  }

  private init(): void {
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxParticles * 3);
    const colors = new Float32Array(this.maxParticles * 3);
    this.velocities = new Float32Array(this.maxParticles * 3);
    this.lifetimes = new Float32Array(this.maxParticles);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });

    this.particles = new THREE.Points(this.geometry, mat);
    this.scene.add(this.particles);
  }

  emit(origin: THREE.Vector3): void {
    if (!this.geometry || !this.velocities || !this.lifetimes) return;

    const positions = this.geometry.attributes.position.array as Float32Array;
    const colors = this.geometry.attributes.color.array as Float32Array;
    const count = 5; // particles per emit

    for (let i = 0; i < count && this.activeCount < this.maxParticles; i++) {
      const idx = this.activeCount;
      const i3 = idx * 3;

      positions[i3] = origin.x + (Math.random() - 0.5) * 0.3;
      positions[i3 + 1] = origin.y + Math.random() * 0.2;
      positions[i3 + 2] = origin.z + (Math.random() - 0.5) * 0.3;

      this.velocities[i3] = (Math.random() - 0.5) * 2;
      this.velocities[i3 + 1] = 1 + Math.random() * 2;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 2;

      // Brown-yellow particle colors
      const brownish = Math.random() > 0.5;
      colors[i3] = brownish ? 0.6 : 1.0;
      colors[i3 + 1] = brownish ? 0.3 : 0.85;
      colors[i3 + 2] = brownish ? 0.1 : 0.0;

      this.lifetimes[idx] = 0.5 + Math.random() * 0.3;
      this.activeCount++;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.setDrawRange(0, this.activeCount);
  }

  update(dt: number): void {
    if (!this.geometry || !this.velocities || !this.lifetimes) return;

    const positions = this.geometry.attributes.position.array as Float32Array;
    this.elapsed += dt;

    let writeIdx = 0;
    for (let i = 0; i < this.activeCount; i++) {
      this.lifetimes[i] -= dt;
      if (this.lifetimes[i] <= 0) continue;

      const r3 = i * 3;
      const w3 = writeIdx * 3;

      if (writeIdx !== i) {
        positions[w3] = positions[r3];
        positions[w3 + 1] = positions[r3 + 1];
        positions[w3 + 2] = positions[r3 + 2];
        this.velocities[w3] = this.velocities[r3];
        this.velocities[w3 + 1] = this.velocities[r3 + 1];
        this.velocities[w3 + 2] = this.velocities[r3 + 2];
        this.lifetimes[writeIdx] = this.lifetimes[i];
      }

      positions[w3] += this.velocities[w3] * dt;
      positions[w3 + 1] += this.velocities[w3 + 1] * dt;
      positions[w3 + 2] += this.velocities[w3 + 2] * dt;
      this.velocities[w3 + 1] -= 3 * dt; // gravity

      writeIdx++;
    }

    this.activeCount = writeIdx;
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.setDrawRange(0, this.activeCount);
  }

  reset(): void {
    this.activeCount = 0;
    this.elapsed = 0;
    if (this.geometry) {
      this.geometry.setDrawRange(0, 0);
    }
  }

  dispose(): void {
    if (this.particles) {
      this.scene.remove(this.particles);
      this.geometry?.dispose();
      (this.particles.material as THREE.Material).dispose();
    }
  }
}
