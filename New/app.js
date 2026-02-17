const TILE = 90;
const PAD = 8;
const GRID = TILE - PAD * 2;
const CELL = GRID / 3;

function parseAlg(str){
  return str.trim().split(/\s+/).filter(Boolean).map(t => t.replace(/’/g, "'"));
}

function moveToInstruction(tok){
  const base = tok[0];
  const prime = tok.includes("'");
  const dbl = tok.includes("2");

  let dir = null;

  if(base === "R") dir = prime ? "down" : "up";
  if(base === "L") dir = prime ? "up" : "down";
  if(base === "U") dir = prime ? "right" : "left";
  if(base === "D") dir = prime ? "left" : "right";
  if(base === "F") dir = prime ? "ccw" : "cw";

  return { base, dir, dbl };
}

function drawGrid(svg){
  const ns = "http://www.w3.org/2000/svg";

  for(let i=0;i<=3;i++){
    const v = document.createElementNS(ns,"line");
    v.setAttribute("x1", PAD + i*CELL);
    v.setAttribute("y1", PAD);
    v.setAttribute("x2", PAD + i*CELL);
    v.setAttribute("y2", PAD + GRID);
    v.setAttribute("stroke", "#000");
    v.setAttribute("stroke-width", "2");
    svg.appendChild(v);

    const h = document.createElementNS(ns,"line");
    h.setAttribute("x1", PAD);
    h.setAttribute("y1", PAD + i*CELL);
    h.setAttribute("x2", PAD + GRID);
    h.setAttribute("y2", PAD + i*CELL);
    h.setAttribute("stroke", "#000");
    h.setAttribute("stroke-width", "2");
    svg.appendChild(h);
  }
}

function drawArrow(svg, dir, cx, cy){
  const ns = "http://www.w3.org/2000/svg";
  const g = document.createElementNS(ns,"g");
  g.setAttribute("transform",`translate(${cx},${cy})`);
  svg.appendChild(g);

  const line = document.createElementNS(ns,"line");
  line.setAttribute("stroke","#000");
  line.setAttribute("stroke-width","3");
  line.setAttribute("stroke-linecap","round");

  const head = document.createElementNS(ns,"polygon");
  head.setAttribute("fill","#000");

  if(dir==="up"){
    line.setAttribute("x1",0); line.setAttribute("y1",22);
    line.setAttribute("x2",0); line.setAttribute("y2",-22);
    head.setAttribute("points","0,-26 -4,-18 4,-18");
  }
  if(dir==="down"){
    line.setAttribute("x1",0); line.setAttribute("y1",-22);
    line.setAttribute("x2",0); line.setAttribute("y2",22);
    head.setAttribute("points","0,26 -4,18 4,18");
  }
  if(dir==="left"){
    line.setAttribute("x1",22); line.setAttribute("y1",0);
    line.setAttribute("x2",-22); line.setAttribute("y2",0);
    head.setAttribute("points","-26,0 -18,-4 -18,4");
  }
  if(dir==="right"){
    line.setAttribute("x1",-22); line.setAttribute("y1",0);
    line.setAttribute("x2",22); line.setAttribute("y2",0);
    head.setAttribute("points","26,0 18,-4 18,4");
  }

  g.appendChild(line);
  g.appendChild(head);
}

/**
 * FIXED curved arrow for F moves:
 * - Draw a circular arc path
 * - Add a real arrowhead at the end using geometry
 */
function drawCurvedArrow(svg, cw, cx, cy){
  const ns = "http://www.w3.org/2000/svg";
  const r = 24;

  // arc angles (in radians). y axis down, so these visually match what you expect.
  const start = cw ? Math.PI : -Math.PI/2;
  const end   = cw ? -Math.PI/2 : Math.PI;

  // endpoints
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);

  // large-arc-flag = 0, sweep-flag depends on cw
  const sweep = cw ? 1 : 0;

  const path = document.createElementNS(ns,"path");
  path.setAttribute("d", `M ${x1} ${y1} A ${r} ${r} 0 0 ${sweep} ${x2} ${y2}`);
  path.setAttribute("fill","none");
  path.setAttribute("stroke","#000");
  path.setAttribute("stroke-width","3");
  path.setAttribute("stroke-linecap","round");
  svg.appendChild(path);

  // Arrowhead at end: tangent direction at end angle
  // For a circle: tangent is perpendicular to radius.
  const angleEnd = end;
  // radial direction
  const rx = Math.cos(angleEnd);
  const ry = Math.sin(angleEnd);
  // tangent direction (choose based on sweep)
  // cw sweep visually means increasing sweep-flag in SVG coords; this works well:
  const tx = cw ? -ry : ry;
  const ty = cw ? rx : -rx;

  const headLen = 10;
  const headWid = 8;

  const tipX = x2;
  const tipY = y2;

  const baseX = tipX - tx * headLen;
  const baseY = tipY - ty * headLen;

  // perpendicular to tangent
  const px = -ty;
  const py = tx;

  const p2x = baseX + px * (headWid/2);
  const p2y = baseY + py * (headWid/2);
  const p3x = baseX - px * (headWid/2);
  const p3y = baseY - py * (headWid/2);

  const head = document.createElementNS(ns,"polygon");
  head.setAttribute("fill","#000");
  head.setAttribute("points", `${tipX},${tipY} ${p2x},${p2y} ${p3x},${p3y}`);
  svg.appendChild(head);
}

function renderTile(tok){
  const ins = moveToInstruction(tok);
  const ns = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(ns,"svg");
  svg.setAttribute("width",TILE);
  svg.setAttribute("height",TILE);
  svg.setAttribute("viewBox",`0 0 ${TILE} ${TILE}`);

  drawGrid(svg);

  const midX = PAD + 1.5*CELL;
  const midY = PAD + 1.5*CELL;

  if(ins.base==="R"){
    drawArrow(svg, ins.dir, PAD + 2.5*CELL, midY);
  }
  if(ins.base==="L"){
    drawArrow(svg, ins.dir, PAD + 0.5*CELL, midY);
  }
  if(ins.base==="U"){
    drawArrow(svg, ins.dir, midX, PAD + 0.5*CELL);
  }
  if(ins.base==="D"){
    drawArrow(svg, ins.dir, midX, PAD + 2.5*CELL);
  }
  if(ins.base==="F"){
    drawCurvedArrow(svg, ins.dir==="cw", midX, midY);
  }

  if(ins.dbl){
    const t = document.createElementNS(ns,"text");
    t.textContent="x2";
    t.setAttribute("x",TILE/2);
    t.setAttribute("y",TILE/2+6);
    t.setAttribute("text-anchor","middle");
    t.setAttribute("font-size","22");
    t.setAttribute("font-weight","700");
    t.setAttribute("fill","#000");
    svg.appendChild(t);
  }

  return svg;
}

function renderAlg(){
  const out = document.getElementById("out");
  out.innerHTML = "";

  const toks = parseAlg(document.getElementById("alg").value);
  toks.forEach(t => out.appendChild(renderTile(t)));
}

document.getElementById("renderBtn").addEventListener("click", renderAlg);
renderAlg();
