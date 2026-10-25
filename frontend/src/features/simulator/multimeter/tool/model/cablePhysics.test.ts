import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { CableSolver, createTubeGeometry, updateTubeGeometry, type BoxCollider } from "./cablePhysics";

const FLOOR_Y = 0.008;

function buildSolver() {
    return new CableSolver(
        new THREE.Vector3(0, 0.62, 0),
        new THREE.Vector3(0.42, 0.019, 0.58),
        28,
        [
            new THREE.Vector3(0.08, 0.4, 0.24),
            new THREE.Vector3(0.3, 0.08, 0.42),
            new THREE.Vector3(0.16, 0.02, 0.56),
            new THREE.Vector3(-0.04, 0.02, 0.5),
        ],
    );
}

describe("CableSolver", () => {
    it("builds a pinned cable path above the floor", () => {
        const solver = buildSolver();
        expect(solver.points).toHaveLength(28);
        expect(solver.points[0].distanceTo(new THREE.Vector3(0, 0.62, 0))).toBeLessThan(1e-6);
        expect(solver.points[solver.points.length - 1].distanceTo(new THREE.Vector3(0.42, 0.019, 0.58))).toBeLessThan(1e-6);
        for (const point of solver.points) expect(point.y).toBeGreaterThanOrEqual(FLOOR_Y - 1e-6);
        expect(solver.segmentLength).toBeGreaterThan(0);
    });

    it("pins both ends and keeps the floor constraint while dragging", () => {
        const solver = buildSolver();
        const start = new THREE.Vector3(0.1, 0.62, 0.08);
        const end = new THREE.Vector3(0.54, 0.019, 0.64);
        for (let i = 0; i < 40; i += 1) solver.step(1 / 60, start, end, []);

        expect(solver.points[0].distanceTo(start)).toBeLessThan(1e-6);
        expect(solver.points[solver.points.length - 1].distanceTo(end)).toBeLessThan(1e-6);
        for (const point of solver.points) expect(point.y).toBeGreaterThanOrEqual(FLOOR_Y - 1e-6);
    });

    it("keeps segment lengths close to the sampled length", () => {
        const solver = buildSolver();
        for (let i = 0; i < 12; i += 1) solver.step(1 / 60, new THREE.Vector3(0, 0.62, 0), new THREE.Vector3(0.42, 0.019, 0.58), []);
        for (let i = 0; i < solver.points.length - 1; i += 1) {
            expect(solver.points[i].distanceTo(solver.points[i + 1])).toBeCloseTo(solver.segmentLength, 2);
        }
    });

    it("pushes inner points out of a device collider", () => {
        const object = new THREE.Object3D();
        object.updateMatrixWorld();
        const collider: BoxCollider = {
            object,
            center: new THREE.Vector3(0, 0.32, 0.22),
            halfExtents: new THREE.Vector3(0.14, 0.14, 0.14),
        };
        const solver = new CableSolver(
            new THREE.Vector3(0, 0.62, 0),
            new THREE.Vector3(0, 0.62, 0.6),
            32,
            [
                new THREE.Vector3(0, 0.32, 0.1),
                new THREE.Vector3(0, 0.32, 0.22),
                new THREE.Vector3(0, 0.32, 0.34),
            ],
        );
        for (let i = 0; i < 20; i += 1) solver.step(1 / 60, new THREE.Vector3(0, 0.62, 0), new THREE.Vector3(0, 0.62, 0.6), [collider]);

        for (let i = 1; i < solver.points.length - 1; i += 1) {
            const local = solver.points[i].clone().sub(collider.center);
            const inside = Math.abs(local.x) < collider.halfExtents.x - 0.002
                && Math.abs(local.y) < collider.halfExtents.y - 0.002
                && Math.abs(local.z) < collider.halfExtents.z - 0.002;
            expect(inside).toBe(false);
        }
    });
});

describe("cable tube geometry", () => {
    it("allocates the expected buffers and updates them from the solver points", () => {
        const geometry = createTubeGeometry(10, 6);
        const expectedVertices = (10 + 1) * (6 + 1);
        expect(geometry.attributes.position.count).toBe(expectedVertices);
        expect(geometry.attributes.position.array).toHaveLength(expectedVertices * 3);
        expect(geometry.attributes.normal.count).toBe(expectedVertices);
        expect(geometry.attributes.uv.count).toBe(expectedVertices);
        expect(geometry.getIndex()?.count).toBe(10 * 6 * 6);

        const points = [
            new THREE.Vector3(0, 0.04, 0),
            new THREE.Vector3(0.2, 0.02, 0.2),
            new THREE.Vector3(0.5, 0.02, 0.4),
        ];
        updateTubeGeometry(geometry, points, 10, 6, 0.01);
        const positions = geometry.attributes.position.array as Float32Array;
        for (const value of positions) expect(Number.isFinite(value)).toBe(true);
        expect(geometry.boundingSphere?.radius ?? 0).toBeGreaterThan(0);
        geometry.dispose();
    });
});
