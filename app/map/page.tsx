"use client";

import { useRef, Suspense, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

interface AgentData {
  id: string;
  name: string;
}

interface MapMetrics {
  floorY: number;
  centerX: number;
  centerZ: number;
  safeRadius: number;
}

// --- UTILS: TƯƠNG TÁC OPFS ---
const getAgentDirectory = async (): Promise<FileSystemDirectoryHandle> => {
  const root = await navigator.storage.getDirectory();
  return await root.getDirectoryHandle("agent", { create: true });
};

const saveAgentToOpfs = async (name: string): Promise<AgentData> => {
  const id = `agent_${Date.now()}`;
  const dir = await getAgentDirectory();
  const fileHandle = await dir.getFileHandle(`${id}.json`, { create: true });
  const writable = await fileHandle.createWritable({ keepExistingData: false });
  
  const agentData: AgentData = { id, name };
  await writable.write(JSON.stringify(agentData));
  await writable.close();
  return agentData;
};

const loadAgentsFromOpfs = async (): Promise<AgentData[]> => {
  try {
    const dir = await getAgentDirectory();
    const agents: AgentData[] = [];
    for await (const entry of dir.values()) {
      if (entry.kind === "file" && entry.name.endsWith(".json")) {
        const file = await entry.getFile();
        const text = await file.text();
        agents.push(JSON.parse(text));
      }
    }
    return agents;
  } catch (e) {
    console.error("Failed to load agents from OPFS", e);
    return [];
  }
};

// --- UTILS: TẠO VỊ TRÍ TỰ DO KHÔNG ĐÂM VÀO NHÀ ---
// Hàm sinh tọa độ X, Z ngẫu nhiên hoàn toàn trên bản đồ nhưng né vùng polygon của nhà
const getFreeRandomPosition = (metrics: MapMetrics, mapSize = 50) => {
  let posX = 0;
  let posZ = 0;
  let isValid = false;
  
  // Vùng cấm (nhà + khoảng đệm an toàn)
  const forbiddenRadius = metrics.safeRadius + 1.5;

  while (!isValid) {
    // Sinh tọa độ tự do trong khoảng từ [-mapSize/2, mapSize/2]
    posX = (Math.random() - 0.5) * mapSize;
    posZ = (Math.random() - 0.5) * mapSize;

    // Tính khoảng cách từ điểm vừa sinh tới tâm thực tế của ngôi nhà
    const dx = posX - metrics.centerX;
    const dz = posZ - metrics.centerZ;
    const distanceToHouse = Math.sqrt(dx * dx + dz * dz);

    // Nếu nằm ngoài phạm vi ngôi nhà thì vị trí này hợp lệ
    if (distanceToHouse > forbiddenRadius) {
      isValid = true;
    }
  }

  return { x: posX, z: posZ };
};

// --- COMPONENT BẢN ĐỒ ---
function ForestMap({ onMetricsCalculated }: { onMetricsCalculated: (metrics: MapMetrics) => void }) {
  const { scene } = useGLTF("/models/forest_house.glb");
  const scale = 15.0;

  useEffect(() => {
    if (scene) {
      scene.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(scene);
      
      const size = new THREE.Vector3();
      box.getSize(size);
      const sizeX = size.x * scale;
      const sizeZ = size.z * scale;
      
      const center = new THREE.Vector3();
      box.getCenter(center);
      const centerX = center.x * scale;
      const centerZ = center.z * scale;
      
      const floorY = box.min.y * scale; 
      const safeRadius = Math.max(sizeX, sizeZ) / 2;

      onMetricsCalculated({
        floorY,
        centerX,
        centerZ,
        safeRadius
      });
    }
  }, [scene, onMetricsCalculated]);

  return (
    <primitive 
      object={scene} 
      position={[0, 0, 0]} 
      scale={scale} 
    />
  );
}

// --- COMPONENT AI AGENT (NHÂN VẬT THÁM HIỂM DI CHUYỂN TỰ DO) ---
function AutonomousAgent({ id, metrics }: { id: string; metrics: MapMetrics }) {
  const { scene, animations } = useGLTF("/models/stickman.glb");
  
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  const charRef = useRef<THREE.Group>(null);
  const { actions } = useAnimations(animations, charRef);
  const targetPos = useRef(new THREE.Vector3(0, metrics.floorY, 0));
  const speed = 3.5; 
  const MAP_BOUNDS_SIZE = 40; // Độ rộng vùng di chuyển tự do của map (40x40 đơn vị)

  // Đồng bộ cao độ sàn
  useEffect(() => {
    if (!charRef.current) return;
    charRef.current.position.y = metrics.floorY;
    targetPos.current.y = metrics.floorY;
  }, [metrics.floorY]);

  useEffect(() => {
    if (!charRef.current) return;

    // Khởi tạo vị trí xuất hiện tự do ngẫu nhiên trên bản đồ
    const spawnPos = getFreeRandomPosition(metrics, MAP_BOUNDS_SIZE);
    charRef.current.position.set(spawnPos.x, metrics.floorY, spawnPos.z);

    if (actions["Run"]) actions["Run"].play();

    // Điểm đích tự do đầu tiên
    const firstTarget = getFreeRandomPosition(metrics, MAP_BOUNDS_SIZE);
    targetPos.current.set(firstTarget.x, metrics.floorY, firstTarget.z);
  }, [actions, metrics]);

  useFrame((_, delta) => {
    if (!charRef.current) return;

    const currentPos = charRef.current.position;
    const distance = currentPos.distanceTo(targetPos.current);

    // Khi đến gần điểm đích tự do, tìm một điểm tự do bất kỳ khác trên map để đi tới tiếp
    if (distance < 0.6) {
      const nextTarget = getFreeRandomPosition(metrics, MAP_BOUNDS_SIZE);
      targetPos.current.set(nextTarget.x, metrics.floorY, nextTarget.z);
    }

    // Di chuyển tịnh tiến tới đích
    const dir = new THREE.Vector3().subVectors(targetPos.current, currentPos).normalize();
    charRef.current.position.x += dir.x * speed * delta;
    charRef.current.position.z += dir.z * speed * delta;

    // Xoay mượt mà theo hướng di chuyển
    const targetAngle = Math.atan2(dir.x, dir.z);
    charRef.current.rotation.y = THREE.MathUtils.lerp(charRef.current.rotation.y, targetAngle, 0.15);
  });

  return (
    <primitive 
      ref={charRef} 
      object={clonedScene} 
      position={[0, metrics.floorY, 0]} 
      scale={0.4} 
    />
  );
}

// --- MAIN SIMULATION PAGE ---
export default function MapPage() {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [inputName, setInputName] = useState<string>("");
  
  const [mapMetrics, setMapMetrics] = useState<MapMetrics>({
    floorY: 0,
    centerX: 0,
    centerZ: 0,
    safeRadius: 5
  });

  useEffect(() => {
    loadAgentsFromOpfs().then(setAgents);
  }, []);

  const handleAddAgent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputName.trim()) return;

    const newAgent = await saveAgentToOpfs(inputName);
    setAgents((prev) => [...prev, newAgent]);
    setInputName("");
    setShowPopup(false);
  };

  return (
    <div className="w-screen h-screen bg-slate-950 overflow-hidden select-none relative">
      
      {/* HUD BUTTON THÊM NGƯỜI */}
      <div className="absolute top-6 left-6 z-10">
        <button 
          onClick={() => setShowPopup(true)}
          className="px-5 py-3 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-medium rounded-xl shadow-lg shadow-sky-500/20 transition-all border border-sky-400"
        >
          ➕ Thêm Người Thám Hiểm
        </button>
        <div className="mt-2 text-xs text-slate-400 bg-slate-900/60 p-2 rounded-md backdrop-blur-sm">
          Tổng số Bot trong OPFS: <span className="text-sky-400 font-bold">{agents.length}</span>
        </div>
      </div>

      {/* POPUP THÊM THÔNG TIN */}
      {showPopup && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <form onSubmit={handleAddAgent} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-80 shadow-2xl">
            <h3 className="text-white font-semibold text-lg mb-4">Cấu Hình Định Danh Agent</h3>
            <div className="mb-4">
              <label className="block text-xs text-slate-400 mb-1 font-medium">TÊN ĐỊNH DANH</label>
              <input 
                type="text" 
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="Ví dụ: Agent Alpha, Bot-01..."
                className="w-full bg-slate-950 text-white border border-slate-700 px-3 py-2 rounded-lg focus:outline-hidden focus:border-sky-500 text-sm"
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button 
                type="button" 
                onClick={() => setShowPopup(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white transition"
              >
                Hủy
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium rounded-lg transition"
              >
                Khởi Tạo & Lưu OPFS
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3D RENDER CANVAS */}
      <Canvas camera={{ position: [0, 15, 25], fov: 45 }}>
        <color attach="background" args={["#020617"]} />
        
        <ambientLight intensity={1.5} />
        <pointLight position={[30, 30, 30]} intensity={2.5} />
        <pointLight position={[-30, -30, -30]} intensity={1} color="#38bdf8" />
        <directionalLight position={[10, 30, 10]} intensity={2} />
        <Stars radius={150} depth={50} count={1200} factor={4} saturation={0} fade speed={0.5} />

        <group>
          <Suspense fallback={null}>
            <ForestMap onMetricsCalculated={setMapMetrics} />
          </Suspense>

          {agents.map((agent) => (
            <Suspense key={agent.id} fallback={null}>
              <AutonomousAgent id={agent.id} metrics={mapMetrics} />
            </Suspense>
          ))}
        </group>

        <OrbitControls 
          enableRotate={true} 
          enableZoom={true}    
          enablePan={true} 
          maxDistance={60}
          minDistance={2}
          maxPolarAngle={Math.PI / 2 - 0.05} 
        />
      </Canvas>
    </div>
  );
}

try {
  useGLTF.preload("/models/stickman.glb");
  useGLTF.preload("/models/forest_house.glb");
} catch (e) {
  console.error("Preload assets failed:", e);
}