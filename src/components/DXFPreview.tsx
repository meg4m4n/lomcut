import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DXFLoader } from 'three-dxf';
import type { VectorPath, PathRepair } from '../types';

interface DXFPreviewProps {
  vectorPaths: VectorPath[];
  showRepairs: boolean;
  onPieceClick: (path: VectorPath) => void;
}

export const DXFPreview: React.FC<DXFPreviewProps> = ({
  vectorPaths,
  showRepairs,
  onPieceClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf9fafb); // Light gray background
    sceneRef.current = scene;

    // Initialize camera
    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const camera = new THREE.OrthographicCamera(
      -100 * aspect, 100 * aspect,
      100, -100,
      0.1, 1000
    );
    camera.position.set(0, 0, 100);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Initialize controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = false;
    controls.enablePan = true;
    controls.enableZoom = true;
    controlsRef.current = controls;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Update scene when vectorPaths change
  useEffect(() => {
    if (!sceneRef.current) return;

    // Clear existing paths
    sceneRef.current.children = sceneRef.current.children.filter(
      child => child instanceof THREE.Camera || child instanceof THREE.Light
    );

    // Add vector paths
    vectorPaths.forEach(path => {
      const material = new THREE.LineBasicMaterial({
        color: getPathColor(path.status),
        linewidth: path.isExterior ? 2 : 1,
      });

      const points = path.segments.map(segment => 
        new THREE.Vector3(segment.start.x, segment.start.y, 0)
      );
      // Close the path
      if (path.segments.length > 0) {
        points.push(new THREE.Vector3(
          path.segments[0].start.x,
          path.segments[0].start.y,
          0
        ));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      line.userData = { pathId: path.id };
      sceneRef.current.add(line);

      // Add repairs if enabled
      if (showRepairs && path.repairs.length > 0) {
        path.repairs.forEach(repair => {
          const repairMaterial = new THREE.LineBasicMaterial({
            color: 0xffd700,
            linewidth: 2,
          });

          if (repair.type === 'gap') {
            const repairPoints = [
              new THREE.Vector3(repair.start.x, repair.start.y, 0),
              new THREE.Vector3(repair.end.x, repair.end.y, 0),
            ];
            const repairGeometry = new THREE.BufferGeometry().setFromPoints(repairPoints);
            const repairLine = new THREE.Line(repairGeometry, repairMaterial);
            sceneRef.current?.add(repairLine);
          } else {
            // Intersection point marker
            const markerGeometry = new THREE.CircleGeometry(2, 32);
            const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffd700 });
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.set(repair.start.x, repair.start.y, 0);
            sceneRef.current?.add(marker);
          }
        });
      }
    });

    // Add click event listener
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (event: MouseEvent) => {
      if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(sceneRef.current.children);

      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        const pathId = clickedObject.userData.pathId;
        if (pathId) {
          const clickedPath = vectorPaths.find(p => p.id === pathId);
          if (clickedPath) {
            onPieceClick(clickedPath);
          }
        }
      }
    };

    containerRef.current?.addEventListener('click', onClick);
    return () => {
      containerRef.current?.removeEventListener('click', onClick);
    };
  }, [vectorPaths, showRepairs, onPieceClick]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;

      const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      const camera = cameraRef.current;
      camera.left = -100 * aspect;
      camera.right = 100 * aspect;
      camera.updateProjectionMatrix();

      rendererRef.current.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getPathColor = (status: 'uncut' | 'cut' | 'defect'): number => {
    switch (status) {
      case 'cut':
        return 0x22c55e; // Green
      case 'defect':
        return 0xef4444; // Red
      default:
        return 0x1f2937; // Dark gray
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-medium mb-4">Pré-visualização do Corte</h3>
      <div 
        ref={containerRef} 
        className="relative w-full bg-gray-50 rounded"
        style={{ paddingBottom: '75%' }}
      />
    </div>
  );
};
