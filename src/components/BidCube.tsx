import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

export default function BidCube() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth;
    const H = mount.clientHeight;

    // ── Renderer ──────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // ── Scene & Camera ────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0, 5);

    // ── Group (holds cube + edges + particles) ────────────────
    const group = new THREE.Group();
    scene.add(group);

    // ── Main Cube — Glassy dark material ──────────────────────
    const geo = new THREE.BoxGeometry(2, 2, 2);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x0a0a0a,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.6,
      thickness: 1.5,
      transparent: true,
      opacity: 0.55,
      envMapIntensity: 1.2,
    });
    const cube = new THREE.Mesh(geo, mat);
    cube.castShadow = true;
    group.add(cube);

    // ── Glowing Wireframe Edges ───────────────────────────────
    const edgesGeo = new THREE.EdgesGeometry(geo);
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0xa3e635,   // lime-400
      linewidth: 1,
    });
    const edges = new THREE.LineSegments(edgesGeo, edgeMat);
    group.add(edges);

    // Slightly scaled outer glow frame
    const outerEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(2.03, 2.03, 2.03)),
      new THREE.LineBasicMaterial({ color: 0xa3e635, transparent: true, opacity: 0.2 })
    );
    group.add(outerEdges);

    // ── "BID" text on front face via canvas texture ───────────
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 512, 512);
    ctx.fillStyle = 'rgba(163, 230, 53, 0.08)';
    ctx.fillRect(0, 0, 512, 512);
    ctx.font = 'bold 160px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#a3e635';
    ctx.fillText('BID', 256, 256);
    ctx.strokeStyle = 'rgba(163, 230, 53, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeText('BID', 256, 256);

    const faceTex = new THREE.CanvasTexture(canvas);
    const faceMat = new THREE.MeshBasicMaterial({
      map: faceTex,
      transparent: true,
      opacity: 0.95,
    });
    // Apply text only to front (+Z) face
    const materials = Array(6).fill(mat);
    materials[4] = faceMat;   // front face
    cube.material = materials as THREE.Material[];

    // ── Floating Particles ────────────────────────────────────
    const particleCount = 120;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const r = 2.8 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xa3e635,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── Corner accent dots ────────────────────────────────────
    const cornerPositions = [
      [ 1,  1,  1], [-1,  1,  1], [ 1, -1,  1], [-1, -1,  1],
      [ 1,  1, -1], [-1,  1, -1], [ 1, -1, -1], [-1, -1, -1],
    ];
    cornerPositions.forEach(([x, y, z]) => {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xa3e635 })
      );
      dot.position.set(x, y, z);
      group.add(dot);
    });

    // ── Lighting ──────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Lime key light from top-left
    const keyLight = new THREE.PointLight(0xa3e635, 4, 12);
    keyLight.position.set(-3, 3, 3);
    scene.add(keyLight);

    // Indigo fill from bottom-right
    const fillLight = new THREE.PointLight(0x6366f1, 3, 10);
    fillLight.position.set(3, -2, -2);
    scene.add(fillLight);

    // White rim
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
    rimLight.position.set(0, 5, -5);
    scene.add(rimLight);

    // ── GSAP idle rotation ────────────────────────────────────
    const rot = { x: 0.4, y: 0.6 };

    gsap.to(rot, {
      x: rot.x + Math.PI * 2,
      y: rot.y + Math.PI * 2,
      duration: 12,
      ease: 'none',
      repeat: -1,
    });

    // ── Mouse parallax ────────────────────────────────────────
    let mx = 0, my = 0;
    const onMouse = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth  - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouse);

    // ── Hover: scale up ───────────────────────────────────────
    const onEnter = () => gsap.to(group.scale, { x: 1.08, y: 1.08, z: 1.08, duration: 0.4, ease: 'power2.out' });
    const onLeave = () => gsap.to(group.scale, { x: 1,    y: 1,    z: 1,    duration: 0.4, ease: 'power2.out' });
    mount.addEventListener('mouseenter', onEnter);
    mount.addEventListener('mouseleave', onLeave);

    // ── Entrance animation ────────────────────────────────────
    group.scale.set(0, 0, 0);
    gsap.to(group.scale, {
      x: 1, y: 1, z: 1,
      duration: 1.2,
      ease: 'elastic.out(1, 0.5)',
      delay: 0.4,
    });

    // ── Render loop ───────────────────────────────────────────
    let frameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Apply gsap rotation + subtle mouse parallax
      group.rotation.x = rot.x + my * 0.3;
      group.rotation.y = rot.y + mx * 0.3;

      // Pulsing light intensity
      keyLight.intensity = 4 + Math.sin(t * 1.5) * 1.2;
      fillLight.intensity = 3 + Math.cos(t * 1.1) * 0.8;

      // Slow particle drift
      particles.rotation.y = t * 0.06;
      particles.rotation.x = t * 0.03;

      // Edge glow pulse
      (outerEdges.material as THREE.LineBasicMaterial).opacity =
        0.15 + Math.sin(t * 2) * 0.1;

      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ────────────────────────────────────────────────
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // ── Cleanup ───────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', onResize);
      mount.removeEventListener('mouseenter', onEnter);
      mount.removeEventListener('mouseleave', onLeave);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-full"
      style={{ minHeight: 420 }}
    />
  );
}
