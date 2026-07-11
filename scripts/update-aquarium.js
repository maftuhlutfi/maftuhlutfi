const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '../data/state.json');
const SVG_OUT = path.join(__dirname, '../aquarium.svg');
const BG_FILE = path.join(__dirname, '../assets/bg.png');
const FISH_FILE = path.join(__dirname, '../assets/fishes_t.png');
const PLANT_FILE = path.join(__dirname, '../assets/plants_t.png');
const DECO_FILE = path.join(__dirname, '../assets/decos_t.png');

let state = { fishes: [], plants: [], decorations: [], recent_contributors: [] };
if (fs.existsSync(STATE_FILE)) {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
}

const action = process.argv[2];
const user = process.argv[3];

if (user && action && ['fish', 'plant', 'decoration'].includes(action)) {
    if (!state.recent_contributors.includes(user)) {
        state.recent_contributors.push(user);
        if (state.recent_contributors.length > 5) state.recent_contributors.shift();
    }
    
    // Helper function to find a non-overlapping X coordinate
    function getValidX() {
        let attempts = 0;
        let newX = 0;
        let isValid = false;
        
        while (attempts < 50 && !isValid) {
            newX = Math.floor(Math.random() * 700) + 10;
            isValid = true;
            
            for (let p of state.plants) {
                if (Math.abs(p.x - newX) < 45) isValid = false;
            }
            for (let d of state.decorations) {
                if (Math.abs(d.x - newX) < 45) isValid = false;
            }
            attempts++;
        }
        return newX;
    }

    if (action === 'fish') {
        state.fishes.push({
            v: Math.floor(Math.random() * 4) + 1,
            y: Math.floor(Math.random() * 200) + 50,
            s: (Math.random() * 0.15 + 0.15).toFixed(2), // scaled down significantly (15%-30%)
            dur: Math.floor(Math.random() * 15) + 10,
            dir: Math.random() > 0.5 ? 1 : -1
        });
        if (state.fishes.length > 20) state.fishes.shift();
    } else if (action === 'plant') {
        state.plants.push({
            v: Math.floor(Math.random() * 4) + 1,
            x: getValidX(),
            s: (Math.random() * 0.15 + 0.2).toFixed(2) // plant scaled down
        });
        if (state.plants.length > 15) state.plants.shift();
    } else if (action === 'decoration') {
        state.decorations.push({
            v: Math.floor(Math.random() * 4) + 1,
            x: getValidX(),
            s: (Math.random() * 0.15 + 0.2).toFixed(2) // deco scaled down
        });
        if (state.decorations.length > 10) state.decorations.shift();
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

const bg64 = fs.readFileSync(BG_FILE).toString('base64');
const fish64 = fs.readFileSync(FISH_FILE).toString('base64');
const plant64 = fs.readFileSync(PLANT_FILE).toString('base64');
const deco64 = fs.readFileSync(DECO_FILE).toString('base64');

// Exact bounding boxes from sprite sheet mapping
const fishBoxes = [
    {x: 46, y: 435, w: 214, h: 153},
    {x: 291, y: 445, w: 205, h: 143},
    {x: 527, y: 445, w: 205, h: 143},
    {x: 763, y: 455, w: 215, h: 133}
];
const plantBoxes = [
    {x: 25, y: 297, w: 235, h: 429},
    {x: 276, y: 337, w: 251, h: 389},
    {x: 537, y: 369, w: 230, h: 357},
    {x: 783, y: 302, w: 215, h: 424}
];
const decoBoxes = [
    {x: 31, y: 379, w: 225, h: 255},
    {x: 281, y: 384, w: 220, h: 245},
    {x: 522, y: 399, w: 235, h: 220},
    {x: 773, y: 384, w: 225, h: 245}
];

// RENDER
let svgFishes = state.fishes.map(f => {
    let box = fishBoxes[(f.v || 1) - 1] || fishBoxes[0];
    let viewBox = `${box.x} ${box.y} ${box.w} ${box.h}`;
    let width = Math.round(box.w * f.s);
    let height = Math.round(box.h * f.s);
    
    let fromX = f.dir === 1 ? -150 : 950;
    let toX = f.dir === 1 ? 950 : -150;
    
    // To properly flip the image inside the crop viewBox, mirror it around the center of the crop box.
    // Center = box.x + box.w / 2. Translation offset = 2 * Center = 2*box.x + box.w.
    let cx2 = (box.x * 2) + box.w;
    let flip = f.dir === -1 ? `transform="translate(${cx2}, 0) scale(-1, 1)"` : ``;

    return `<g>
        <animateTransform attributeName="transform" type="translate" from="${fromX} ${f.y}" to="${toX} ${f.y}" dur="${f.dur}s" repeatCount="indefinite" />
        <svg width="${width}" height="${height}" viewBox="${viewBox}">
            <g ${flip}>
                <image href="data:image/png;base64,${fish64}" x="0" y="0" width="1024" height="1024" />
            </g>
        </svg>
    </g>`;
}).join('\n');

let svgPlants = state.plants.map(p => {
    let box = plantBoxes[(p.v || 1) - 1] || plantBoxes[0];
    let viewBox = `${box.x} ${box.y} ${box.w} ${box.h}`;
    let width = Math.round(box.w * p.s);
    let height = Math.round(box.h * p.s);
    // Adjust Y position so they sit perfectly in the sand
    let baseFloorY = 375 + (p.x % 15); 
    return `<svg x="${p.x}" y="${baseFloorY - height}" width="${width}" height="${height}" viewBox="${viewBox}">
        <image href="data:image/png;base64,${plant64}" x="0" y="0" width="1024" height="1024" />
    </svg>`;
}).join('\n');

let svgDecos = state.decorations.map(d => {
    let box = decoBoxes[(d.v || 1) - 1] || decoBoxes[0];
    let viewBox = `${box.x} ${box.y} ${box.w} ${box.h}`;
    let width = Math.round(box.w * d.s);
    let height = Math.round(box.h * d.s);
    let baseFloorY = 385 + (d.x % 15); // Decos sit slightly lower than plants
    return `<svg x="${d.x}" y="${baseFloorY - height}" width="${width}" height="${height}" viewBox="${viewBox}">
        <image href="data:image/png;base64,${deco64}" x="0" y="0" width="1024" height="1024" />
    </svg>`;
}).join('\n');

let recentLines = [];
if (state.recent_contributors.length > 0) {
    let allStr = `Recent contributors: @${state.recent_contributors.join(', @')}`;
    let currentLine = '';
    let parts = allStr.split(', ');
    for (let i = 0; i < parts.length; i++) {
        let part = parts[i] + (i < parts.length - 1 ? ', ' : '');
        // Limit roughly to 35 chars per line to fit the smaller 340px width box
        if ((currentLine + part).length > 35) {
            recentLines.push(currentLine.trim());
            currentLine = part;
        } else {
            currentLine += part;
        }
    }
    if (currentLine.trim()) recentLines.push(currentLine.trim());
} else {
    recentLines.push('Be the first to add something!');
}

// Added extra 10px base height for better bottom padding
let boxHeight = 45 + (recentLines.length * 16);
let innerBoxHeight = boxHeight - 4;
let textsSvg = recentLines.map((line, i) => `<text x="25" y="${55 + (i * 16)}" font-family="'Courier New', Courier, monospace" font-size="12" fill="#00FF7F">${line}</text>`).join('\n    ');

// Stats Logic
let countFishes = state.fishes.length;
let countPlants = state.plants.length;
let countDecos = state.decorations.length;

let statsSvg = `
    <!-- Stats Box with Retro Border -->
    <rect x="650" y="10" width="140" height="95" fill="rgba(15, 30, 60, 0.7)" stroke="#4169E1" stroke-width="2" />
    <rect x="652" y="12" width="136" height="91" fill="none" stroke="#87CEFA" stroke-width="1" />
    
    <!-- Stats Typography -->
    <text x="665" y="30" font-family="'Courier New', Courier, monospace" font-size="14" fill="#FFFFFF" font-weight="bold">TANK STATS</text>
    <line x1="660" y1="38" x2="780" y2="38" stroke="#87CEFA" stroke-width="1" stroke-dasharray="2 2" />
    <text x="665" y="55" font-family="'Courier New', Courier, monospace" font-size="12" fill="#00FF7F">🐟 Fish: ${countFishes}</text>
    <text x="665" y="72" font-family="'Courier New', Courier, monospace" font-size="12" fill="#00FF7F">🌿 Plant: ${countPlants}</text>
    <text x="665" y="89" font-family="'Courier New', Courier, monospace" font-size="12" fill="#00FF7F">🐚 Deco: ${countDecos}</text>
`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
    <!-- Shifted background up slightly to reveal more sand/bottom structure -->
    <image href="data:image/png;base64,${bg64}" x="0" y="-240" width="800" height="800" preserveAspectRatio="xMidYMid slice" />
    ${svgPlants}
    ${svgDecos}
    ${svgFishes}
    
    <!-- UI Text Box with Retro Border -->
    <rect x="10" y="10" width="340" height="${boxHeight}" fill="rgba(15, 30, 60, 0.7)" stroke="#4169E1" stroke-width="2" />
    <rect x="12" y="12" width="336" height="${innerBoxHeight}" fill="none" stroke="#87CEFA" stroke-width="1" />
    
    <!-- Retro Typography -->
    <text x="25" y="35" font-family="'Courier New', Courier, monospace" font-size="18" fill="#FFFFFF" font-weight="bold">🐟 PIXEL AQUARIUM 🌿</text>
    ${textsSvg}
    
    ${statsSvg}
</svg>`;

fs.writeFileSync(SVG_OUT, svg);
console.log('Aquarium SVG generated with Exact Bounding Boxes!');
