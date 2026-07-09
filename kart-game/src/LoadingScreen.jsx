import { useGSAP } from "@gsap/react";
import { useProgress } from "@react-three/drei";
import { useRef } from "react";
import gsap from "gsap";

const BUTTON_TEXT = "Wideass & Tats Kart";

export const LoadingScreen = () => {
  const containerRef = useRef(null);
  const backgroundRef = useRef(null);
  const screenRef = useRef(null);
  const { progress } = useProgress();

  const characters = BUTTON_TEXT.split("");
  const charactersWithoutSpaces = characters.filter((c) => !/\s/.test(c));
  let charIndex = 1;
  
  useGSAP(() => {
    if(progress === 100){
      gsap.to(backgroundRef.current,{
        filter: "blur(0px)",
        duration: 1,
        delay: 1,
        onComplete:() => {
          gsap.to(screenRef.current,{
            autoAlpha: 0,
            duration: 0.5
          })
        }
      })
    }
    
  }, [progress])

  return (
    <div className="loading-screen" ref={screenRef}>
      <div className="loading" ref={containerRef}>
        {characters.map((char, i) => {
          if (!/\s/.test(char)) {
            const delay = `calc(2s / ${charactersWithoutSpaces.length} * ${charIndex} * 0.5)`;
            charIndex++;
            return (
              <span
                key={i}
                className="button-text-character"
                style={{ "--delay": delay }}
              >
                {char}
              </span>
            );
          } else {
            return (
              <span key={i} className="button-text-space">
                {char}
              </span>
            );
          }
        })}
      </div>
      
      <div className="mention">
        A non-profit fan project starring <strong>Tats</strong> &amp; <strong>Wideass</strong>.
        <br />
        Not affiliated with <strong>Nintendo Co. Ltd.</strong>
      </div>
      <div className="loading-bg-overlay" aria-hidden="true" />
      <img
        ref={backgroundRef}
        className="background"
        src={"./snes.webp"}
        alt=""
        style={{ filter: "blur(100px)" }}
      />
    </div>
  );
};