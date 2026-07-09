import { StrictMode, Suspense, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import { BoardScene } from "./scene/BoardScene.jsx";
import { initArenaBridge } from "./arenaBridge.js";
import { useBoardStore } from "./store.js";
import { GameHud } from "./GameHud.jsx";
import "./index.css";

function LoadingOverlay() {
  const { active, progress } = useProgress();
  const ready = useBoardStore((s) => s.ready);
  const show = active || !ready;
  return (
    <div className={"fruity-loading" + (show ? "" : " is-hidden")}>
      <div className="fruity-loading-grape">🍇</div>
      <div className="fruity-loading-title">Get Fruity</div>
      <div className="fruity-loading-bar">
        <span style={{ width: Math.max(8, Math.round(progress)) + "%" }} />
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    initArenaBridge();
  }, []);

  return (
    <>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 17, 19], fov: 46, near: 0.1, far: 400 }}
      >
        <Suspense fallback={null}>
          <BoardScene />
        </Suspense>
      </Canvas>
      <GameHud />
      <LoadingOverlay />
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
