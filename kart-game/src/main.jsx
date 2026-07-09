import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { WebGPUCanvas } from './WebGPUCanvas.jsx'
import { MobileControls } from './mobile/MobileControls.jsx'
import { LoadingScreen } from './LoadingScreen.jsx'
import { initArenaBridge } from './arenaBridge.js'
import { DriverHud } from './DriverHud.jsx'
import { RaceHud } from './RaceHud.jsx'
import { KartLobby } from './KartLobby.jsx'
import { useArenaBridge } from './arenaBridge.js'

initArenaBridge()

function KartShell() {
  const raceStarted = useArenaBridge((s) => s.raceStarted);

  return (
    <div className='canvas-container'>
      <KartLobby />
      {raceStarted ? <DriverHud /> : null}
      {raceStarted ? <RaceHud /> : null}
      {raceStarted ? <MobileControls /> : null}
      <Suspense fallback={false}>
        <WebGPUCanvas />
      </Suspense>
      <LoadingScreen />
      <div className="version">v0.4.0</div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <KartShell />
  </StrictMode>
)
