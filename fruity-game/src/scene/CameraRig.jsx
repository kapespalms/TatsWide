import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { tileWorldPos } from "../board.js";
import { useBoardStore } from "../store.js";

function easeLerp(current, target, speed, dt) {
  const t = 1 - Math.exp(-speed * dt);
  return current + (target - current) * t;
}

/** Fixed camera shots — pans only when the game mode changes, never orbits. */
const OVERVIEW = {
  pos: new THREE.Vector3(0, 17, 19),
  target: new THREE.Vector3(0, 0.5, 0),
  fov: 46,
};

const DICE_SHOT = {
  pos: new THREE.Vector3(0, 5.5, 10),
  target: new THREE.Vector3(0, 3.2, 0),
  fov: 38,
};

function tileShot(index) {
  const t = tileWorldPos(index);
  return {
    pos: new THREE.Vector3(t[0] + 2.5, 10, t[2] + 5),
    target: new THREE.Vector3(t[0], 0.6, t[2]),
    fov: 40,
  };
}

export function CameraRig() {
  const { camera } = useThree();
  const lookAt = useRef(new THREE.Vector3().copy(OVERVIEW.target));
  const goalPos = useRef(new THREE.Vector3().copy(OVERVIEW.pos));
  const goalTarget = useRef(new THREE.Vector3().copy(OVERVIEW.target));
  const goalFov = useRef(OVERVIEW.fov);
  const diceUntil = useRef(0);

  const started = useBoardStore((s) => s.started);
  const phase = useBoardStore((s) => s.phase);
  const cardFor = useBoardStore((s) => s.cardFor);
  const positions = useBoardStore((s) => s.positions);
  const rollSeq = useBoardStore((s) => s.rollSeq);
  const spinSeq = useBoardStore((s) => s.spinSeq);

  useEffect(() => {
    if (spinSeq > 0) diceUntil.current = performance.now() + 800;
  }, [spinSeq]);

  useEffect(() => {
    if (rollSeq > 0) diceUntil.current = performance.now() + 1400;
  }, [rollSeq]);

  // Pick a camera shot when game mode changes — NOT every frame.
  useEffect(() => {
    if (!started) {
      goalPos.current.copy(OVERVIEW.pos);
      goalTarget.current.copy(OVERVIEW.target);
      goalFov.current = OVERVIEW.fov;
      return;
    }
    if (phase === "card" && cardFor) {
      const shot = tileShot(positions[cardFor] ?? 0);
      goalPos.current.copy(shot.pos);
      goalTarget.current.copy(shot.target);
      goalFov.current = shot.fov;
      return;
    }
    if (phase === "reveal" && cardFor) {
      const shot = tileShot(positions[cardFor] ?? 0);
      goalPos.current.copy(shot.pos);
      goalTarget.current.copy(shot.target);
      goalFov.current = shot.fov;
      return;
    }
    goalPos.current.copy(OVERVIEW.pos);
    goalTarget.current.copy(OVERVIEW.target);
    goalFov.current = OVERVIEW.fov;
  }, [started, phase, cardFor, positions]);

  useFrame((_, dt) => {
    // Brief dice zoom after a roll, then return to the locked overview.
    if (started && performance.now() < diceUntil.current && phase !== "card" && phase !== "reveal") {
      goalPos.current.copy(DICE_SHOT.pos);
      goalTarget.current.copy(DICE_SHOT.target);
      goalFov.current = DICE_SHOT.fov;
    } else if (started && phase !== "card" && phase !== "reveal") {
      goalPos.current.copy(OVERVIEW.pos);
      goalTarget.current.copy(OVERVIEW.target);
      goalFov.current = OVERVIEW.fov;
    }

    const speed = 2.2;
    camera.position.x = easeLerp(camera.position.x, goalPos.current.x, speed, dt);
    camera.position.y = easeLerp(camera.position.y, goalPos.current.y, speed, dt);
    camera.position.z = easeLerp(camera.position.z, goalPos.current.z, speed, dt);

    lookAt.current.x = easeLerp(lookAt.current.x, goalTarget.current.x, speed, dt);
    lookAt.current.y = easeLerp(lookAt.current.y, goalTarget.current.y, speed, dt);
    lookAt.current.z = easeLerp(lookAt.current.z, goalTarget.current.z, speed, dt);

    camera.lookAt(lookAt.current);
    camera.fov = easeLerp(camera.fov, goalFov.current, 2, dt);
    camera.updateProjectionMatrix();
  });

  return null;
}
