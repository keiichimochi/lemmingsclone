const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height, TILE = 16;

const imgs = {
  sprites: load('assets/office_lemming_sprites.svg'),
  tiles: load('assets/terrain_tiles.svg'),
};
function load(src){ const i = new Image(); i.src = src; return i; }

const terrain = new Uint8Array((W/TILE)*(H/TILE)); //0 air 1 dirt 2 steel
const workers = [];
let selected = null;

class Worker {
  constructor(x,y){ this.x=x; this.y=y; this.vx=1.2; this.vy=0; this.state='walk'; this.dir=1; this.id=Math.random().toString(36).slice(2,8); }
  update(){
    if(this.state==='block'){ this.vx=0; }
    else if(this.state==='build'){ this.vx=0.8*this.dir; this.placeStair(); }
    else if(this.state==='dig'){ this.vx=0; this.digDown(); }
    else { this.vx=1.2*this.dir; }

    const g = this.state==='umbrella' ? 0.08 : 0.28;
    this.vy = Math.min(this.vy + g, this.state==='umbrella'?2.0:7.5);

    this.tryMoveX(this.vx);
    this.tryMoveY(this.vy);

    if(this.x<8){this.dir=1;this.x=8;} if(this.x>W-8){this.dir=-1;this.x=W-8;}

    const aheadX = this.x + this.dir*10;
    if(isSolidPixel(aheadX,this.y-6) && !isSolidPixel(aheadX,this.y-22) && this.state!=='block' && this.state!=='dig'){ this.y -= 2; }
    if(isSolidPixel(aheadX,this.y-16) && isSolidPixel(aheadX,this.y-24) && this.state!=='block'){ this.dir*=-1; }
  }
  tryMoveX(dx){ const nx=this.x+dx; if(!collides(nx,this.y)){ this.x=nx; } else this.dir*=-1; }
  tryMoveY(dy){ const ny=this.y+dy; if(!collides(this.x,ny)){ this.y=ny; } else { if(dy>0) this.state = this.state==='umbrella' ? 'umbrella':'walk'; this.vy=0; }}
  placeStair(){ const tx=((this.x + this.dir*14)/TILE)|0, ty=((this.y-4)/TILE)|0; setTile(tx,ty,1,false); }
  digDown(){ const tx=(this.x/TILE)|0, ty=((this.y+4)/TILE)|0; setTile(tx,ty,0,true); setTile(tx,ty+1,0,true); }
}

function idx(tx,ty){ return ty*(W/TILE)+tx; }
function setTile(tx,ty,v,onlyDirt){ if(tx<0||ty<0||tx>=W/TILE||ty>=H/TILE) return; const i=idx(tx,ty); if(onlyDirt && terrain[i]===2) return; terrain[i]=v; }
function tileAtPixel(x,y){ const tx=(x/TILE)|0, ty=(y/TILE)|0; if(tx<0||ty<0||tx>=W/TILE||ty>=H/TILE) return 2; return terrain[idx(tx,ty)]; }
function isSolidPixel(x,y){ return tileAtPixel(x,y)!==0; }
function collides(x,y){ return isSolidPixel(x-6,y)||isSolidPixel(x+6,y)||isSolidPixel(x-6,y-18)||isSolidPixel(x+6,y-18); }

function buildLevel(){
  for(let y=0;y<H/TILE;y++)for(let x=0;x<W/TILE;x++)terrain[idx(x,y)]=0;
  for(let y=36;y<45;y++) for(let x=0;x<80;x++) terrain[idx(x,y)]=1;
  for(let y=30;y<36;y++) for(let x=28;x<36;x++) terrain[idx(x,y)]=2;
  for(let y=26;y<31;y++) for(let x=54;x<70;x++) terrain[idx(x,y)]=1;
}

function spawn(){ for(let i=0;i<12;i++) workers.push(new Worker(60+i*10,560)); }

canvas.addEventListener('click', e=>{
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX-r.left)*(W/r.width), y=(e.clientY-r.top)*(H/r.height);
  selected = workers.find(w=>Math.hypot(w.x-x, w.y-10-y)<18) || null;
});
addEventListener('keydown', e=>{
  if(!selected) return;
  const map = {Digit1:'walk',Digit2:'block',Digit3:'build',Digit4:'dig',Digit5:'umbrella'};
  if(map[e.code]) selected.state = map[e.code];
});

function drawTerrain(){
  for(let y=0;y<H/TILE;y++)for(let x=0;x<W/TILE;x++){
    const t = terrain[idx(x,y)]; if(!t) continue;
    const sx = t===2?256:0;
    ctx.drawImage(imgs.tiles, sx,0,256,256, x*TILE,y*TILE,TILE,TILE);
  }
}
function drawWorker(w){
  const states = {walk:0,block:1,build:2,dig:3,umbrella:4};
  const frame = states[w.state] ?? 0;
  const sx = frame*512;
  ctx.save();
  ctx.translate(w.x,w.y);
  if(w.dir<0) ctx.scale(-1,1);
  ctx.drawImage(imgs.sprites,sx,0,512,512,-24,-48,48,48);
  if(selected===w){ ctx.strokeStyle='#ff0044'; ctx.beginPath(); ctx.arc(0,-32,14,0,Math.PI*2); ctx.stroke(); }
  ctx.restore();
}

function loop(){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#b6d8fb'; ctx.fillRect(0,0,W,H);
  for(const w of workers) w.update();
  drawTerrain();
  for(const w of workers) drawWorker(w);
  requestAnimationFrame(loop);
}

buildLevel(); spawn(); loop();
