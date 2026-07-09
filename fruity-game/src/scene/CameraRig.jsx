import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { tileWorldPos } from "../board.js";
import { CARD_DECK_POS } from "../cardPresentation.js";
import { useBoardStore } from "../store.js";

function easeLerp(current, target, speed, dt) {
  const t = 1 - Math.exp(-speed * dt);
  return current + (target - current) * t;
}

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

function followShot(index) {
  const t = tileWorldPos(index);
  return {
    pos: new THREE.Vector3(t[0] + 2.4, 10.5, t[2] + 5.8),
    target: new THREE.Vector3(t[0], 0.8, t[2]),
    fov: 48,
  };
}

function deckShot() {
  const [dx, , dz] = CARD_DECK_POS;
  return {
    pos: new THREE.Vector3(dx - 2.8, 9.2, dz + 7.2),
    target: new THREE.Vector3(dx, 0.85, dz),
    fov: 40,
  };
}

export function CameraRig() {
  const { camera } = useThree();
  const lookAt = useRef(new THREE.Vector3().copy(OVERVIEW.target));
  const goalPos = useRef(new THREE.Vector3().copy(OVERVIEW.pos));
  const goalTarget = useRef(new THREE.Vector3().copy(OVERVIEW.target));
  const goalFov = useRef(OVERVIEW.fov);

  const started = useBoardStore((s) => s.started);
  const phase = useBoardStore((s) => s.phase);
  const cardFor = useBoardStore((s) => s.cardFor);
  const positions = useBoardStore((s) => s.positions);
  const isMoving = useBoardStore((s) => s.isMoving);
  const rollStep = useBoardStore((s) => s.rollStep);
  const lastMover = useBoardStore((s) => s.lastMover);
  const cameraFollowIndex = useBoardStore((s) => s.cameraFollowIndex);
  const cardPresentStep = useBoardStore((s) => s.cardPresentStep);

  useEffect(() => {
    if (!started) {
      goalPos.current.copy(OVERVIEW.pos);
      goalTarget.current.copy(OVERVIEW.target);
      goalFov.current = OVERVIEW.fov;
    }
  }, [started]);

  useFrame((_, dt) => {
    if (!started) return;

    if (phase === "reveal") {
      const shot = deckShot();
      goalPos.current.copy(shot.pos);
      goalTarget.current.copy(shot.target);
      goalFov.current = shot.fov;
    } else if (phase === "card") {
      if (cardPresentStep === "approach" && cardFor) {
        const shot = followShot(positions[cardFor] ?? 0);
        goalPos.current.copy(shot.pos);
        goalTarget.current.copy(shot.target);
        goalFov.current = shot.fov;
      } else {
        const shot = deckShot();
        goalPos.current.copy(shot.pos);
        goalTarget.current.copy(shot.target);
        goalFov.current = shot.fov;
      }
    } else if (isMoving && rollStep === "move" && lastMover) {
      const idx =
        typeof cameraFollowIndex === "number"
          ? cameraFollowIndex
          : positions[lastMover] ?? 0;
      const shot = followShot(idx);
      goalPos.current.copy(shot.pos);
      goalTarget.current.copy(shot.target);
      goalFov.current = shot.fov;
    } else if (isMoving && rollStep === "dice") {
      goalPos.current.copy(DICE_SHOT.pos);
      goalTarget.current.copy(DICE_SHOT.target);
      goalFov.current = DICE_SHOT.fov;
    } else {
      goalPos.current.copy(OVERVIEW.pos);
      goalTarget.current.copy(OVERVIEW.target);
      goalFov.current = OVERVIEW.fov;
    }

    const panning =
      (isMoving && rollStep === "move") || phase === "card" || phase === "reveal";
    const speed =
      isMoving && rollStep === "move"
        ? 2.0
        : phase === "card" || phase === "reveal"
          ? 1.45
          : 2.0;
    const fovSpeed = panning ? 1.4 : 2.2;
    camera.position.x = easeLerp(camera.position.x, goalPos.current.x, speed, dt);
    camera.position.y = easeLerp(camera.position.y, goalPos.current.y, speed, dt);
    camera.position.z = easeLerp(camera.position.z, goalPos.current.z, speed, dt);

    lookAt.current.x = easeLerp(lookAt.current.x, goalTarget.current.x, speed, dt);
    lookAt.current.y = easeLerp(lookAt.current.y, goalTarget.current.y, speed, dt);
    lookAt.current.z = easeLerp(lookAt.current.z, goalTarget.current.z, speed, dt);

    camera.lookAt(lookAt.current);
    camera.fov = easeLerp(camera.fov, goalFov.current, fovSpeed, dt);
    camera.updateProjectionMatrix();
  });

  return null;
}
