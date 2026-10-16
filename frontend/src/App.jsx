import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sky, PointerLockControls, useGLTF, Stars, Environment } from '@react-three/drei';

function MilitaryTerrain() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[120, 120, 64, 64]} />
        <meshStandardMaterial color="#423525" roughness={0.9} metalness={0.1} flatShading={true} />
      </mesh>
      <mesh position={[0, -5, -45]}><coneGeometry args={[45, 25, 4]} /><meshStandardMaterial color="#2d2216" roughness={1} flatShading={true} /></mesh>
      <mesh position={[-35, -5, -40]} rotation={[0, 0.5, 0]}><coneGeometry args={[35, 18, 4]} /><meshStandardMaterial color="#2d2216" roughness={1} flatShading={true} /></mesh>
      <mesh position={[35, -5, -40]} rotation={[0, -0.5, 0]}><coneGeometry args={[35, 18, 4]} /><meshStandardMaterial color="#2d2216" roughness={1} flatShading={true} /></mesh>
    </group>
  );
}

function TargetDrone({ id, position, isThreat, speed, onHit, setLocked }) {
  const droneRef = useRef();
  const { scene } = useGLTF('/drone.glb');
  const autoFireTimer = useRef(null);

  useFrame(() => {
    if (droneRef.current) {
      droneRef.current.position.z += speed;
      droneRef.current.position.y += Math.sin(Date.now() / 200) * 0.01;
      droneRef.current.position.x += Math.sin(Date.now() / 500 + id) * 0.005;
      if (droneRef.current.position.z > 5) droneRef.current.position.z = -25;
    }
  });

  useEffect(() => {
    return () => {
      if (autoFireTimer.current) clearTimeout(autoFireTimer.current);
    };
  }, []);

  return (
    <group
      ref={droneRef}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setLocked(true);
        autoFireTimer.current = setTimeout(() => {
          setLocked(false);
          onHit(id, isThreat);
        }, 380);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setLocked(false);
        if (autoFireTimer.current) clearTimeout(autoFireTimer.current);
      }}
    >
      <primitive object={scene.clone()} scale={2.4} />
      <mesh visible={false}>
        <boxGeometry args={[4, 2, 4]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}

function EnvironmentScene({ env }) {
  if (env === 'night') {
    return (
      <>
        <color attach="background" args={['#03050c']} />
        <ambientLight intensity={0.4} />
        <hemisphereLight skyColor="#111122" groundColor="#000000" intensity={0.5} />
        <directionalLight position={[0, 10, -10]} intensity={1.5} color="#00ffcc" />
        <Stars radius={100} depth={50} count={8000} factor={4} saturation={0} fade speed={1} />
        <fog attach="fog" args={['#03050c', 10, 50]} />
      </>
    );
  } else if (env === 'degraded') {
    return (
      <>
        <color attach="background" args={['#24262b']} />
        <fog attach="fog" args={['#24262b', 2, 22]} />
        <ambientLight intensity={2.0} />
        <directionalLight position={[5, 10, 5]} intensity={2.5} color="#ffa500" />
      </>
    );
  } else {
    return (
      <>
        <color attach="background" args={['#a2d2ff']} />
        <ambientLight intensity={2.5} />
        <hemisphereLight skyColor="#ffffff" groundColor="#5e4f3c" intensity={2.0} />
        <directionalLight position={[10, 20, 10]} intensity={3.5} />
        <Sky sunPosition={[80, 20, 100]} />
        <fog attach="fog" args={['#a2d2ff', 25, 75]} />
      </>
    );
  }
}

export default function App() {
  const [traineeName, setTraineeName] = useState("Jawan_01");
  const [unit, setUnit] = useState("Alpha Platoon");
  const [difficulty, setDifficulty] = useState("veteran");
  const [totalScore, setTotalScore] = useState(0);
  const [hqFeedback, setHqFeedback] = useState("Awaiting deployment...");
  const [drones, setDrones] = useState([]);
  const [environment, setEnvironment] = useState('day');
  const [startTime, setStartTime] = useState(Date.now());
  const [activeWeapon, setActiveWeapon] = useState('kinetic');
  const [isLocked, setIsLocked] = useState(false);
  const [vfxFlash, setVfxFlash] = useState(null);
  const [vrEnabled, setVrEnabled] = useState(false);

  // Speed according to difficulty to prevent rote learning
  const getDroneSpeed = () => {
    if (difficulty === 'recruit') return 0.04;
    if (difficulty === 'veteran') return 0.07;
    return 0.11; // Elite
  };

  const deploySwarm = () => {
    const swarmCount = difficulty === 'recruit' ? 6 : (difficulty === 'veteran' ? 9 : 12);
    const newSwarm = [];
    for (let i = 0; i < swarmCount; i++) {
      newSwarm.push({
        id: i,
        position: [(Math.random() - 0.5) * 18, Math.random() * 2.5 + 0.5, (Math.random() - 0.5) * 15 - 14],
        isThreat: Math.random() > 0.45
      });
    }
    setDrones(newSwarm);
    setStartTime(Date.now());
    setHqFeedback("Swarm engaged! Aim at targets for auto-fire.");
  };

  const handleEngagement = async (id, isThreat) => {
    const reactionTime = Date.now() - startTime;
    setHqFeedback(`Engaging with ${activeWeapon.toUpperCase()}...`);

    try {
      const sound = new Audio(activeWeapon === 'kinetic' ? '/gun.mp3' : '/jammer.mp3');
      sound.volume = 0.5;
      sound.play().catch(() => {});
    } catch (_) {}

    setVfxFlash(activeWeapon);
    setTimeout(() => setVfxFlash(null), 150);
    setDrones((prev) => prev.filter((d) => d.id !== id));

    try {
      const response = await fetch("https://dronedrishti-backend.onrender.com/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainee_id: traineeName,
          unit_id: unit,
          difficulty: difficulty,
          reaction_time_ms: reactionTime,
          is_threat: isThreat,
          weapon_used: activeWeapon,
          environment: environment
        })
      });
      const data = await response.json();
      if(data.status === "success") {
        setTotalScore((prev) => prev + data.final_score);
        setHqFeedback(`Score: ${data.final_score} | ${data.feedback}`);
      }
    } catch (error) {
      setHqFeedback("Error: Backend offline.");
    }
  };

  const scopeColor = isLocked ? '#ff3333' : '#00ffcc';

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      
      {/* HUD Panel */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, color: '#00ffcc', fontFamily: 'monospace', background: 'rgba(5, 12, 22, 0.85)', padding: '16px', border: '2px solid #00ffcc', borderRadius: '4px' }}>
        <h3 style={{ margin: 0, letterSpacing: '2px' }}>DRONEDRISHTI SIM</h3>
        <p style={{ margin: '6px 0', color: '#fff' }}>Operator: <b>{traineeName}</b> [{unit}]</p>
        <p style={{ margin: '6px 0', color: '#ffaa00' }}>Difficulty: {difficulty.toUpperCase()}</p>
        <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '6px 0', color: '#fff' }}>Combat Score: <span style={{color: '#00ffcc'}}>{totalScore}</span></p>
        <p style={{ color: '#00ffcc', maxWidth: '300px', fontSize: '12px' }}>HQ: {hqFeedback}</p>
        <small style={{ color: '#aaa' }}>[Click screen to Aim | ESC to Unlock]</small>
      </div>

      {/* Control Panel */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, background: 'rgba(5, 12, 22, 0.85)', padding: '16px', border: '2px solid #ffaa00', borderRadius: '4px', color: 'white', fontFamily: 'monospace', width: '220px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#ffaa00' }}>MISSION CONFIG</h4>
        
        <label style={{ fontSize: '12px' }}>Trainee Call-Sign:</label>
        <input value={traineeName} onChange={(e) => setTraineeName(e.target.value)} style={{ width: '100%', background: '#111', color: '#fff', border: '1px solid #555', marginBottom: '8px', padding: '4px' }} />

        <label style={{ fontSize: '12px' }}>Unit / Platoon:</label>
        <select value={unit} onChange={(e) => setUnit(e.target.value)} style={{ width: '100%', background: '#111', color: '#fff', border: '1px solid #555', marginBottom: '8px', padding: '4px' }}>
          <option>Alpha Platoon</option>
          <option>Bravo Squad</option>
          <option>Delta Recon</option>
        </select>

        <label style={{ fontSize: '12px' }}>Adaptive AI Difficulty:</label>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ width: '100%', background: '#111', color: '#fff', border: '1px solid #555', marginBottom: '8px', padding: '4px' }}>
          <option value="recruit">Recruit (Slow / Clear)</option>
          <option value="veteran">Veteran (Standard)</option>
          <option value="elite">Elite (Hyper Swarm)</option>
        </select>

        <label style={{ fontSize: '12px' }}>Scenario:</label>
        <select value={environment} onChange={(e) => setEnvironment(e.target.value)} style={{ width: '100%', background: '#111', color: '#fff', border: '1px solid #555', marginBottom: '12px', padding: '4px' }}>
          <option value="day">Daylight Clear</option>
          <option value="night">Night Combat</option>
          <option value="degraded">Degraded (Fog)</option>
        </select>

        <button onClick={deploySwarm} style={{ padding: '10px', background: 'red', color: 'white', fontWeight: 'bold', width: '100%', cursor: 'pointer', border: 'none', borderRadius: '3px' }}>
          🚨 DEPLOY SWARM 🚨
        </button>

        <button onClick={() => setVrEnabled(!vrEnabled)} style={{ padding: '6px', background: vrEnabled ? '#00ffcc' : '#333', color: vrEnabled ? '#000' : '#fff', fontWeight: 'bold', width: '100%', marginTop: '8px', border: '1px solid #00ffcc', cursor: 'pointer' }}>
          🥽 {vrEnabled ? "VR MODE: ACTIVE" : "ENABLE VR MODE"}
        </button>
      </div>

      {/* Scope Overlay */}
      <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '200px', height: '200px', border: `2px solid ${scopeColor}`, borderRadius: '50%', position: 'absolute', opacity: 0.7 }}></div>
          <div style={{ width: '80px', height: '80px', borderLeft: `3px solid ${scopeColor}`, borderRight: `3px solid ${scopeColor}`, position: 'absolute' }}></div>
          <div style={{ width: '80px', height: '80px', borderTop: `3px solid ${scopeColor}`, borderBottom: `3px solid ${scopeColor}`, position: 'absolute' }}></div>
          <div style={{ color: scopeColor, fontSize: '18px', fontWeight: 'bold' }}>+</div>
        </div>
        <span style={{ color: scopeColor, fontFamily: 'monospace', fontSize: '13px', marginTop: '10px', fontWeight: 'bold' }}>
          {isLocked ? "⚠️ TARGET LOCKED [AUTO-FIRE]" : "SYSTEM: SCANNING"}
        </span>
      </div>

      {/* Weapon Toggle */}
      <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: '20px' }}>
        <button onClick={() => setActiveWeapon('kinetic')} style={{ padding: '14px 30px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', background: activeWeapon === 'kinetic' ? '#ffaa00' : '#222', color: activeWeapon === 'kinetic' ? '#000' : '#fff', border: '2px solid #ffaa00', borderRadius: '4px' }}>
          🔫 KINETIC GUN
        </button>
        <button onClick={() => setActiveWeapon('jammer')} style={{ padding: '14px 30px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', background: activeWeapon === 'jammer' ? '#00ffcc' : '#222', color: activeWeapon === 'jammer' ? '#000' : '#fff', border: '2px solid #00ffcc', borderRadius: '4px' }}>
          📡 EW JAMMER
        </button>
      </div>

      {vfxFlash && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20, pointerEvents: 'none', background: vfxFlash === 'kinetic' ? 'rgba(255,200,0,0.3)' : 'rgba(0,255,255,0.3)' }} />}

      <Canvas camera={{ position: [0, 2, 5], fov: 75 }}>
        <Environment preset="city" />
        <EnvironmentScene env={environment} />
        <MilitaryTerrain />
        {drones.map((drone) => (
          <TargetDrone key={drone.id} id={drone.id} position={drone.position} isThreat={drone.isThreat} speed={getDroneSpeed()} onHit={handleEngagement} setLocked={setIsLocked} />
        ))}
        <PointerLockControls />
      </Canvas>
    </div>
  );
}