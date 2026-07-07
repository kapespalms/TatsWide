/** Tats & Wideass mascot SVGs (matches js/mascots.js). */
export function mascotSVG(kind) {
  const skin = "#ff5a36";
  const ink = "#22090c";
  const head =
    '<circle cx="70" cy="55" r="30" fill="' + skin + '" stroke="' + ink + '" stroke-width="3"/>' +
    '<path d="M46,32 L54,8 L62,30 Z" fill="' + skin + '" stroke="' + ink + '" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M94,32 L86,8 L78,30 Z" fill="' + skin + '" stroke="' + ink + '" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M40,50 L26,42 L34,64 Z" fill="' + skin + '" stroke="' + ink + '" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M100,50 L114,42 L106,64 Z" fill="' + skin + '" stroke="' + ink + '" stroke-width="3" stroke-linejoin="round"/>';
  const mouth =
    '<path d="M58,68 Q70,77 82,68" stroke="' + ink + '" stroke-width="3" fill="none" stroke-linecap="round"/>';
  const neck = '<rect x="62" y="80" width="16" height="14" fill="' + skin + '"/>';
  const tail =
    '<path d="M92,142 C116,150 122,172 104,184 C110,178 100,176 98,166" fill="' + skin + '" stroke="' + ink + '" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M96,180 L110,183 L98,190 Z" fill="' + skin + '" stroke="' + ink + '" stroke-width="3" stroke-linejoin="round"/>';
  const armL =
    '<rect x="20" y="98" width="20" height="46" rx="10" fill="' + skin + '" stroke="' + ink + '" stroke-width="3"/>' +
    '<circle cx="30" cy="146" r="9" fill="' + skin + '" stroke="' + ink + '" stroke-width="3"/>';
  const armR =
    '<rect x="100" y="98" width="20" height="46" rx="10" fill="' + skin + '" stroke="' + ink + '" stroke-width="3"/>' +
    '<circle cx="110" cy="146" r="9" fill="' + skin + '" stroke="' + ink + '" stroke-width="3"/>';

  if (kind === "tats") {
    const glasses =
      '<rect x="45" y="45" width="50" height="15" rx="7" fill="' + ink + '"/>' +
      '<rect x="50" y="48" width="8" height="4" rx="2" fill="#ffffff" opacity=".55"/>';
    const romper =
      '<rect x="43" y="92" width="54" height="58" rx="12" fill="#161018" stroke="' + ink + '" stroke-width="3"/>' +
      '<rect x="50" y="83" width="9" height="14" fill="#161018"/>' +
      '<rect x="81" y="83" width="9" height="14" fill="#161018"/>';
    const legs =
      '<rect x="49" y="148" width="17" height="52" rx="6" fill="' + skin + '" stroke="' + ink + '" stroke-width="3"/>' +
      '<rect x="74" y="148" width="17" height="42" rx="6" fill="' + skin + '" stroke="' + ink + '" stroke-width="3"/>';
    const legTats =
      '<g stroke="' + ink + '" stroke-width="1.8" fill="none" stroke-linecap="round">' +
      '<path d="M52,154 q4,6 0,12"/><path d="M58,168 q5,5 -2,9"/><path d="M53,182 q6,4 2,10"/>' +
      '<circle cx="60" cy="162" r="2.2" fill="' + ink + '"/>' +
      '<path d="M78,156 q4,5 1,10"/><path d="M84,170 q4,6 -1,8"/><path d="M79,182 q5,3 2,7"/>' +
      '<path d="M55,176 q8,-2 10,4"/><path d="M81,178 q7,-1 8,5"/>' +
      '</g>';
    const armTats =
      '<g stroke="' + ink + '" stroke-width="1.5" fill="none" stroke-linecap="round">' +
      '<path d="M24,104 q5,8 2,14"/><path d="M27,122 q6,5 2,10"/><circle cx="28" cy="134" r="2" fill="' + ink + '"/>' +
      '<path d="M104,106 q-5,7 -2,13"/><path d="M107,124 q-6,6 -2,9"/><path d="M105,136 q4,4 1,8"/>' +
      '</g>';
    const rightSock =
      '<rect x="72" y="186" width="21" height="14" rx="2" fill="#ffffff" stroke="' + ink + '" stroke-width="2"/>' +
      '<rect x="72" y="192" width="21" height="4" fill="#d9261c"/>';
    const rightSandal =
      '<rect x="68" y="198" width="29" height="9" rx="4" fill="#8a5a35" stroke="' + ink + '" stroke-width="2"/>';
    const looseSandal =
      '<rect x="36" y="202" width="26" height="8" rx="4" fill="#8a5a35" stroke="' + ink + '" stroke-width="2" transform="rotate(-18 49 206)"/>';
    const bareToes =
      '<ellipse cx="57" cy="201" rx="8" ry="4" fill="' + skin + '" stroke="' + ink + '" stroke-width="2"/>';
    return (
      '<svg viewBox="0 0 140 210" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Tats">' +
      tail + legs + legTats + looseSandal + bareToes + rightSock + rightSandal +
      armL + armR + armTats + romper + head + glasses + mouth + neck +
      "</svg>"
    );
  }

  const glasses =
    '<circle cx="58" cy="52" r="10" fill="none" stroke="' + ink + '" stroke-width="3"/>' +
    '<circle cx="82" cy="52" r="10" fill="none" stroke="' + ink + '" stroke-width="3"/>' +
    '<line x1="68" y1="52" x2="72" y2="52" stroke="' + ink + '" stroke-width="3"/>' +
    '<circle cx="58" cy="52" r="3.4" fill="' + ink + '"/>' +
    '<circle cx="82" cy="52" r="3.4" fill="' + ink + '"/>';
  const shirt =
    '<rect x="38" y="92" width="64" height="52" rx="10" fill="#ffffff" stroke="' + ink + '" stroke-width="3"/>' +
    '<rect x="39" y="98" width="62" height="8" fill="#d9261c"/>' +
    '<rect x="39" y="112" width="62" height="8" fill="#d9261c"/>' +
    '<rect x="39" y="126" width="62" height="8" fill="#d9261c"/>' +
    '<rect x="39" y="140" width="62" height="6" fill="#d9261c"/>';
  const shorts =
    '<rect x="45" y="140" width="50" height="28" rx="8" fill="#a9c9e8" stroke="' + ink + '" stroke-width="3"/>';
  const legs =
    '<rect x="49" y="164" width="15" height="24" rx="5" fill="' + skin + '" stroke="' + ink + '" stroke-width="3"/>' +
    '<rect x="76" y="164" width="15" height="24" rx="5" fill="' + skin + '" stroke="' + ink + '" stroke-width="3"/>';
  const socks =
    '<rect x="47" y="186" width="19" height="14" rx="2" fill="#ffffff" stroke="' + ink + '" stroke-width="2"/>' +
    '<rect x="47" y="192" width="19" height="4" fill="#d9261c"/>' +
    '<rect x="74" y="186" width="19" height="14" rx="2" fill="#ffffff" stroke="' + ink + '" stroke-width="2"/>' +
    '<rect x="74" y="192" width="19" height="4" fill="#d9261c"/>';
  const sandals =
    '<rect x="43" y="198" width="27" height="9" rx="4" fill="#8a5a35" stroke="' + ink + '" stroke-width="2"/>' +
    '<rect x="70" y="198" width="27" height="9" rx="4" fill="#8a5a35" stroke="' + ink + '" stroke-width="2"/>';
  return (
    '<svg viewBox="0 0 140 210" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Wideass">' +
    tail + legs + socks + sandals + armL + armR + shorts + shirt + head + glasses + mouth + neck +
    "</svg>"
  );
}

export function normalizeDriver(value) {
  return value === "tats" ? "tats" : "wideass";
}

export function driverLabel(driver) {
  return driver === "tats" ? "Tats" : "Wideass";
}
