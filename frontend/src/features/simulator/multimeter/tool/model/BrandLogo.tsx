import { useEffect, useState } from "react";
import * as THREE from "three";

const LOGO_URL = "/hbt-logo-full.png";
const LOGO_ASPECT = 644 / 137;

let cachedLogoTexture: THREE.CanvasTexture | null = null;
let logoLoad: Promise<THREE.CanvasTexture> | null = null;

function loadLogoTexture(): Promise<THREE.CanvasTexture> {
    if (cachedLogoTexture) return Promise.resolve(cachedLogoTexture);
    if (logoLoad) return logoLoad;
    logoLoad = new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Unable to create logo canvas"));
                return;
            }
            ctx.drawImage(image, 0, 0);
            const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < pixels.data.length; i += 4) {
                const r = pixels.data[i];
                const g = pixels.data[i + 1];
                const b = pixels.data[i + 2];
                if (pixels.data[i + 3] > 8 && r < 160 && g < 160 && b < 160) {
                    pixels.data[i] = 255;
                    pixels.data[i + 1] = 255;
                    pixels.data[i + 2] = 255;
                }
            }
            ctx.putImageData(pixels, 0, 0);
            const texture = new THREE.CanvasTexture(canvas);
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = 8;
            texture.needsUpdate = true;
            cachedLogoTexture = texture;
            resolve(texture);
        };
        image.onerror = () => reject(new Error("Unable to load HBTronics logo"));
        image.src = LOGO_URL;
    });
    return logoLoad;
}

export function BrandLogo({
    position,
    rotation = [0, 0, 0],
    width = 0.2,
}: {
    position: [number, number, number];
    rotation?: [number, number, number];
    width?: number;
}) {
    const [texture, setTexture] = useState<THREE.CanvasTexture | null>(cachedLogoTexture);
    useEffect(() => {
        let active = true;
        loadLogoTexture()
            .then((loaded) => {
                if (active) setTexture(loaded);
            })
            .catch(() => undefined);
        return () => {
            active = false;
        };
    }, []);

    if (!texture) return null;

    return (
        <mesh position={position} rotation={rotation} renderOrder={4}>
            <planeGeometry args={[width, width / LOGO_ASPECT]} />
            <meshBasicMaterial map={texture} transparent alphaTest={0.03} depthWrite={false} toneMapped={false} />
        </mesh>
    );
}
