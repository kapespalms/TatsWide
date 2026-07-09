import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Text } from "@react-three/drei";
import gsap from "gsap";
import { useBoardStore } from "../store.js";
import { CARD_DECK_POS } from "../cardPresentation.js";

const STACK = 5;

export function CardDeck({ position = CARD_DECK_POS }) {
  const phase = useBoardStore((s) => s.phase);
  const cardPresentStep = useBoardStore((s) => s.cardPresentStep);
  const stackRef = useRef(null);
  const flipCardRef = useRef(null);
  const flipTl = useRef(null);

  const idleBob = phase === "playing" || !cardPresentStep;

  useFrame((_, delta) => {
    if (!stackRef.current || !idleBob) return;
    stackRef.current.rotation.y += delta * 0.08;
  });

  useEffect(() => {
    if (flipTl.current) flipTl.current.kill();
    const card = flipCardRef.current;
    if (!card) return;

    if (cardPresentStep === "flip") {
      card.rotation.set(0, 0, 0);
      card.position.set(0, (STACK - 1) * 0.07, -(STACK - 1) * 0.02);
      flipTl.current = gsap.timeline();
      flipTl.current.to(card.rotation, {
        x: -Math.PI * 0.52,
        duration: 0.55,
        ease: "power2.out",
      });
      flipTl.current.to(
        card.position,
        { y: (STACK - 1) * 0.07 + 1.05, z: 0.55, duration: 0.55, ease: "power2.out" },
        0
      );
      flipTl.current.to(card.rotation, {
        y: Math.PI * 0.12,
        duration: 0.35,
        ease: "sine.out",
      });
      return;
    }

    card.rotation.set(0, 0, 0);
    card.position.set(0, (STACK - 1) * 0.07, -(STACK - 1) * 0.02);
  }, [cardPresentStep]);

  const stackCards = Array.from({ length: STACK - 1 }, (_, i) => i);
  const flipping = cardPresentStep === "flip" || cardPresentStep === "ready";

  return (
    <group position={position}>
      <group ref={stackRef}>
        {stackCards.map((i) => (
          <RoundedBox
            key={i}
            args={[1.05, 0.06, 1.45]}
            radius={0.04}
            smoothness={2}
            position={[i * 0.03, i * 0.07, -i * 0.02]}
            castShadow
          >
            <meshStandardMaterial color="#fff8f0" roughness={0.45} />
          </RoundedBox>
        ))}
      </group>

      <group ref={flipCardRef} position={[0, (STACK - 1) * 0.07, -(STACK - 1) * 0.02]}>
        <RoundedBox args={[1.05, 0.06, 1.45]} radius={0.04} smoothness={2} castShadow>
          <meshStandardMaterial
            color={flipping ? "#ff77c8" : "#fff8f0"}
            emissive={flipping ? "#ff77c8" : "#000000"}
            emissiveIntensity={flipping ? 0.35 : 0}
            roughness={0.4}
          />
        </RoundedBox>
        {flipping ? (
          <Text
            position={[0, 0.08, 0.02]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.22}
            color="#1a0520"
            anchorX="center"
            anchorY="middle"
            maxWidth={0.9}
          >
            MC
          </Text>
        ) : null}
      </group>

      <Text
        position={[0, -0.35, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.28}
        color="#ffd6ef"
        anchorX="center"
        anchorY="middle"
      >
        Cards
      </Text>
    </group>
  );
}
