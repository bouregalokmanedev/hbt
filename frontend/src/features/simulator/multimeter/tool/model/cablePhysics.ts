import * as THREE from "three";

export interface BoxCollider {
    object: THREE.Object3D;
    center: THREE.Vector3;
    halfExtents: THREE.Vector3;
}

const FLOOR_Y = 0.008;
const GRAVITY = 3.2;

export class CableSolver {
    readonly points: THREE.Vector3[];
    readonly segmentLength: number;
    private readonly previous: THREE.Vector3[];
    private readonly local = new THREE.Vector3();
    private readonly delta = new THREE.Vector3();
    private readonly velocity = new THREE.Vector3();

    constructor(start: THREE.Vector3, end: THREE.Vector3, count: number, controls: THREE.Vector3[]) {
        const path = new THREE.CatmullRomCurve3(
            [start.clone(), ...controls.map((point) => point.clone()), end.clone()],
            false,
            "catmullrom",
            0.5,
        );
        const sampled = path.getSpacedPoints(count - 1);
        this.points = sampled.map((point) => {
            point.y = Math.max(FLOOR_Y, point.y);
            return point.clone();
        });
        this.previous = this.points.map((point) => point.clone());
        let total = 0;
        for (let i = 0; i < this.points.length - 1; i += 1) total += this.points[i].distanceTo(this.points[i + 1]);
        this.segmentLength = total / Math.max(1, this.points.length - 1);
    }

    step(delta: number, start: THREE.Vector3, end: THREE.Vector3, colliders: BoxCollider[]) {
        if (delta <= 0) return;
        const dt = Math.min(delta, 1 / 30);
        const last = this.points.length - 1;

        for (let i = 1; i < last; i += 1) {
            const point = this.points[i];
            const previous = this.previous[i];
            this.velocity.copy(point).sub(previous).multiplyScalar(0.985);
            previous.copy(point);
            point.add(this.velocity);
            point.y -= GRAVITY * dt * dt;
        }

        this.points[0].copy(start);
        this.points[last].copy(end);

        const iterations = 12;
        for (let iteration = 0; iteration < iterations; iteration += 1) {
            for (let i = 0; i < last; i += 1) {
                const a = this.points[i];
                const b = this.points[i + 1];
                this.delta.copy(b).sub(a);
                const distance = this.delta.length();
                if (distance < 1e-6) continue;
                const correction = (distance - this.segmentLength) / distance;
                if (i === 0) {
                    b.addScaledVector(this.delta, -correction);
                } else if (i + 1 === last) {
                    a.addScaledVector(this.delta, correction);
                } else {
                    const half = correction * 0.5;
                    a.addScaledVector(this.delta, half);
                    b.addScaledVector(this.delta, -half);
                }
            }
            this.collideFloor();
            this.collideBoxes(colliders);
        }

        this.points[0].copy(start);
        this.points[last].copy(end);
        if (this.points[last].y < FLOOR_Y) this.points[last].y = FLOOR_Y;
    }

    private collideFloor() {
        const last = this.points.length - 1;
        for (let i = 1; i < last; i += 1) {
            const point = this.points[i];
            if (point.y < FLOOR_Y) {
                point.y = FLOOR_Y;
                const previous = this.previous[i];
                this.velocity.copy(point).sub(previous);
                this.velocity.x *= 0.82;
                this.velocity.z *= 0.82;
                previous.copy(point).sub(this.velocity);
            }
        }
    }

    private collideBoxes(colliders: BoxCollider[]) {
        if (colliders.length === 0) return;
        const matrices = colliders.map((collider) => {
            collider.object.updateWorldMatrix(true, false);
            return {
                collider,
                inverse: new THREE.Matrix4().copy(collider.object.matrixWorld).invert(),
                matrix: collider.object.matrixWorld.clone(),
            };
        });
        const last = this.points.length - 1;
        for (let i = 1; i < last; i += 1) {
            const point = this.points[i];
            for (const { collider, inverse, matrix } of matrices) {
                this.local.copy(point).applyMatrix4(inverse);
                const x = this.local.x - collider.center.x;
                const y = this.local.y - collider.center.y;
                const z = this.local.z - collider.center.z;
                const px = collider.halfExtents.x - Math.abs(x);
                const py = collider.halfExtents.y - Math.abs(y);
                const pz = collider.halfExtents.z - Math.abs(z);
                if (px <= 0 || py <= 0 || pz <= 0) continue;
                if (px < py && px < pz) {
                    this.local.x += Math.sign(x || 1) * px;
                } else if (py < pz) {
                    this.local.y += Math.sign(y || 1) * py;
                } else {
                    this.local.z += Math.sign(z || 1) * pz;
                }
                point.copy(this.local.applyMatrix4(matrix));
            }
        }
    }
}

export function createTubeGeometry(tubularSegments: number, radialSegments: number) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array((tubularSegments + 1) * (radialSegments + 1) * 3);
    const normals = new Float32Array(positions.length);
    const uvs = new Float32Array((tubularSegments + 1) * (radialSegments + 1) * 2);
    const indices: number[] = [];
    for (let i = 0; i <= tubularSegments; i += 1) {
        for (let j = 0; j <= radialSegments; j += 1) {
            const index = i * (radialSegments + 1) + j;
            uvs[index * 2] = i / tubularSegments;
            uvs[index * 2 + 1] = j / radialSegments;
        }
    }
    for (let i = 0; i < tubularSegments; i += 1) {
        for (let j = 0; j < radialSegments; j += 1) {
            const a = i * (radialSegments + 1) + j;
            const b = (i + 1) * (radialSegments + 1) + j;
            const c = (i + 1) * (radialSegments + 1) + j + 1;
            const d = i * (radialSegments + 1) + j + 1;
            indices.push(a, b, d, b, c, d);
        }
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    return geometry;
}

const curve = new THREE.CatmullRomCurve3([], false, "catmullrom", 0.5);
const point = new THREE.Vector3();
const normal = new THREE.Vector3();

export function updateTubeGeometry(
    geometry: THREE.BufferGeometry,
    points: THREE.Vector3[],
    tubularSegments: number,
    radialSegments: number,
    radius: number,
) {
    curve.points = points;
    const frames = curve.computeFrenetFrames(tubularSegments, false);
    const position = geometry.attributes.position as THREE.BufferAttribute;
    const normalAttr = geometry.attributes.normal as THREE.BufferAttribute;
    const posArray = position.array as Float32Array;
    const normArray = normalAttr.array as Float32Array;

    for (let i = 0; i <= tubularSegments; i += 1) {
        const t = i / tubularSegments;
        curve.getPoint(t, point);
        const frameNormal = frames.normals[i];
        const frameBinormal = frames.binormals[i];
        for (let j = 0; j <= radialSegments; j += 1) {
            const v = (j / radialSegments) * Math.PI * 2;
            const sin = Math.sin(v);
            const cos = -Math.cos(v);
            normal.copy(frameNormal).multiplyScalar(cos).addScaledVector(frameBinormal, sin).normalize();
            const index = (i * (radialSegments + 1) + j) * 3;
            posArray[index] = point.x + normal.x * radius;
            posArray[index + 1] = point.y + normal.y * radius;
            posArray[index + 2] = point.z + normal.z * radius;
            normArray[index] = normal.x;
            normArray[index + 1] = normal.y;
            normArray[index + 2] = normal.z;
        }
    }
    position.needsUpdate = true;
    normalAttr.needsUpdate = true;
    geometry.computeBoundingSphere();
}
