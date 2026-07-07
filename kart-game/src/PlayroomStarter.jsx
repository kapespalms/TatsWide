import { insertCoin, onPlayerJoin, me } from "playroomkit";
import { useEffect, useRef, memo } from "react";
import { usePlayroomStore } from "./playroomStore";

/** PlayroomKit lobby — sync only; visuals handled by PeerRacers. */
const PlayroomStarterInner = () => {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const start = async () => {
      await insertCoin();

      onPlayerJoin((state) => {
        if (state.id === me().id) return;

        usePlayroomStore.getState().addPlayer(state);

        state.onQuit(() => {
          usePlayroomStore.getState().removePlayer(state);
        });
      });
    };

    start();
  }, []);

  return null;
};

export const PlayroomStarter = memo(PlayroomStarterInner);
