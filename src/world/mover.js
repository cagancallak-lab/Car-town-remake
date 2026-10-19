// Moves a car along a smooth path, steering wheels and spinning tyres.

import * as THREE from 'three';

export function headingOf(dx, dz) {
  return Math.atan2(-dz, dx);
}

export class PathMover {
  /**
   * @param {THREE.Object3D} obj car root (faces +x)
   * @param {Array<{x:number,z:number}>} points
   */
  constructor(obj, points, { speed = 3.2, reverse = false, smooth = true, accel = 3 } = {}) {
    this.obj = obj;
    this.reverse = reverse;
    this.maxSpeed = speed;
    this.speed = obj.userData.moverSpeed ?? 0;
    this.accel = accel;
    const v3 = points.map((p) => new THREE.Vector3(p.x, 0, p.z));
    this.curve = smooth && v3.length > 2 ? new THREE.CatmullRomCurve3(v3, false, 'centripetal', 0.5) : new THREE.CurvePath();
    if (!(smooth && v3.length > 2)) {
      for (let i = 0; i < v3.length - 1; i++) this.curve.add(new THREE.LineCurve3(v3[i], v3[i + 1]));
    }
    this.length = Math.max(this.curve.getLength(), 0.001);
    this.s = 0;
    this.done = false;
    this.tmp = new THREE.Vector3();
    this.tan = new THREE.Vector3();
    this.lastHeading = obj.rotation.y;
  }

  update(dt) {
    if (this.done) return true;
    const remaining = this.length - this.s;
    const brakeDist = (this.speed * this.speed) / (2 * this.accel) + 0.05;
    const target = remaining < brakeDist ? Math.max(0.6, this.maxSpeed * (remaining / brakeDist)) : this.maxSpeed;
    this.speed += Math.sign(target - this.speed) * Math.min(Math.abs(target - this.speed), this.accel * dt);
    const step = this.speed * dt;
    this.s = Math.min(this.length, this.s + step);
    const u = this.s / this.length;
    this.curve.getPointAt(u, this.tmp);
    this.curve.getTangentAt(u, this.tan);
    this.obj.position.x = this.tmp.x;
    this.obj.position.z = this.tmp.z;
    const dir = this.reverse ? -1 : 1;
    const h = headingOf(this.tan.x * dir, this.tan.z * dir);
    let dh = h - this.lastHeading;
    while (dh > Math.PI) dh -= Math.PI * 2;
    while (dh < -Math.PI) dh += Math.PI * 2;
    this.obj.rotation.y = this.lastHeading + dh;
    const car = this.obj.userData.car;
    if (car) {
      car.spinWheels(step * dir);
      car.steer(THREE.MathUtils.clamp((dh / Math.max(dt, 1e-3)) * 0.12 * dir, -0.5, 0.5));
    }
    this.lastHeading = this.obj.rotation.y;
    this.obj.userData.moverSpeed = this.speed;
    if (this.s >= this.length - 1e-4) {
      this.done = true;
      this.obj.userData.moverSpeed = 0;
      car?.steer(0);
    }
    return this.done;
  }
}
