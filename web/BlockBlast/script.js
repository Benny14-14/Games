// BlockBlast - main game script
// keeps simple but robust architecture: Game -> Entities -> Render loop
'use strict';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const highscoreEl = document.getElementById('highscore');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

let game = null;

// --- Utilities ---
function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }

// --- Game constants ---
const PADDLE_BASE_WIDTH = 120;
const PADDLE_HEIGHT = 14;
const BALL_RADIUS = 8;
const BLOCK_ROWS_BASE = 5;
const BLOCK_COLS = 10;
const BLOCK_PADDING = 6;
const BLOCK_TOP = 70;
const BLOCK_HEIGHT = 22;
const POWERUP_CHANCE = 0.12;

// powerups enumerator
const POWERUPS = {
  SPEED: 'SPEED', WIDE: 'WIDE', LIFE: 'LIFE'
};

// --- Persistent highscore ---
const STORAGE_KEY = 'blockblast_highscore';
let highscore = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
highscoreEl.textContent = highscore;

// --- Entities ---
class Paddle {
  constructor(){
    this.width = PADDLE_BASE_WIDTH;
    this.height = PADDLE_HEIGHT;
    this.x = (WIDTH - this.width) / 2;
    this.y = HEIGHT - 40;
    this.speed = 12;
    this.color = '#9ecbff';
  }
  draw(ctx){
    roundRect(ctx, this.x, this.y, this.width, this.height, 8, true, false, '#8fc6ff');
    // small shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(this.x, this.y+this.height, this.width, 2);
  }
  moveTo(x){
    this.x = clamp(x - this.width/2, 8, WIDTH - this.width - 8);
  }
  expand(factor=1.5){
    this.width = PADDLE_BASE_WIDTH * factor;
    this.x = clamp(this.x - (this.width - PADDLE_BASE_WIDTH)/2, 8, WIDTH - this.width - 8);
  }
  reset(){
    this.width = PADDLE_BASE_WIDTH;
    this.x = (WIDTH - this.width) / 2;
  }
}

class Ball {
  constructor(){
    this.reset();
  }
  reset(){
    this.r = BALL_RADIUS;
    this.x = WIDTH/2;
    this.y = HEIGHT - 70;
    this.speed = 5;
    this.dx = (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random()*1.5);
    this.dy = -this.speed;
    this.stuck = true; // stuck to paddle at start
    this.color = '#ffd1a9';
  }
  draw(ctx){
    // glow
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r*3);
    g.addColorStop(0, 'rgba(255,230,180,0.9)');
    g.addColorStop(1, 'rgba(255,230,180,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(this.x,this.y,this.r*2.6,0,Math.PI*2); ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
    ctx.fill();
  }
  update(){
    if(this.stuck) return;
    this.x += this.dx;
    this.y += this.dy;
  }
  speedUp(mult=1.3){ this.dx *= mult; this.dy *= mult; this.speed *= mult; }
}

class Block {
  constructor(x,y,w,h, hp=1, color='#5ddbe6'){
    this.x=x; this.y=y; this.w=w; this.h=h; this.hp=hp; this.alive=true; this.color=color;
  }
  draw(ctx){
    if(!this.alive) return;
    roundRect(ctx, this.x, this.y, this.w, this.h, 6, true, true, this.color);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(this.x, this.y+this.h-4, this.w, 3);
  }
  hit(){
    this.hp--;
    if(this.hp<=0) this.alive=false;
  }
}

class PowerUp {
  constructor(x,y,type){
    this.x=x; this.y=y; this.r=12; this.type=type; this.speed=2.4; this.alive=true;
  }
  update(){ this.y += this.speed; if(this.y > HEIGHT+40) this.alive=false; }
  draw(ctx){
    ctx.save();
    ctx.translate(this.x,this.y);
    roundRect(ctx, -14, -14, 28, 28, 6, true, true, '#2b3e5a');
    ctx.fillStyle = '#fff';
    ctx.font = '14px system-ui';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    const label = this.type[0];
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }
}

// --- Utility drawing ---
function roundRect(ctx,x,y,w,h,r,fill=true,stroke=false, color){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
  if(fill){ ctx.fillStyle = color || '#ccc'; ctx.fill(); }
  if(stroke){ ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.stroke(); }
}

// --- Game class ---
class Game {
  constructor(){
    this.paddle = new Paddle();
    this.ball = new Ball();
    this.blocks = [];
    this.powerups = [];
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.running = false;
    this.paused = false;
    this.req = null;
    this.lastTime = 0;
    this.touching = false;
    this.spawnBlocks();
    this.bindInputs();
    this.updateUI();
  }

  spawnBlocks(){
    this.blocks = [];
    const rows = BLOCK_ROWS_BASE + Math.floor((this.level-1)*0.6);
    const cols = BLOCK_COLS;
    const totalPadding = (cols+1) * BLOCK_PADDING;
    const blockWidth = (WIDTH - totalPadding) / cols;
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const x = BLOCK_PADDING + c*(blockWidth+BLOCK_PADDING);
        const y = BLOCK_TOP + r*(BLOCK_HEIGHT+BLOCK_PADDING);
        // increase hp on higher rows or levels
        const hp = (r % 3 === 0 && this.level > 2) ? 2 : 1;
        // color gradient
        const hue = 180 - Math.floor(140 * (r / Math.max(1,rows-1)));
        const color = `hsl(${hue}deg 80% 60%)`;
        this.blocks.push(new Block(x,y,blockWidth,BLOCK_HEIGHT,hp,color));
      }
    }
  }

  bindInputs(){
    // mouse
    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      if(!this.touching) this.paddle.moveTo(x);
      if(this.ball.stuck) this.ball.x = this.paddle.x + this.paddle.width/2;
    });

    // touch drag
    let ongoing = false;
    canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      ongoing = true; this.touching = true;
      const t = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = (t.clientX - rect.left) * (canvas.width / rect.width);
      this.paddle.moveTo(x);
      if(this.ball.stuck) this.ball.x = this.paddle.x + this.paddle.width/2;
    }, {passive:false});

    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const t = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = (t.clientX - rect.left) * (canvas.width / rect.width);
      this.paddle.moveTo(x);
      if(this.ball.stuck) this.ball.x = this.paddle.x + this.paddle.width/2;
    }, {passive:false});

    canvas.addEventListener('touchend', e => {
      ongoing = false; this.touching = false;
    });

    // keyboard
    window.addEventListener('keydown', e => {
      if(e.key === 'ArrowLeft') this.paddle.moveTo(this.paddle.x - 30);
      if(e.key === 'ArrowRight') this.paddle.moveTo(this.paddle.x + 30);
      if(e.key === ' '){ // space to launch
        if(this.ball.stuck) this.ball.stuck = false;
      }
      if(e.key === 'p' || e.key === 'P') this.togglePause();
    });

    // start/pause buttons
    startBtn.addEventListener('click', () => { this.start(true); });
    pauseBtn.addEventListener('click', () => { this.togglePause(); });
  }

  start(force=false){
    if(force){
      this.resetAll();
    }
    if(!this.running){
      this.running = true;
      this.paused = false;
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    } else {
      // restart while running
      this.resetAll();
    }
  }

  resetAll(){
    this.paddle.reset();
    this.ball.reset();
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.spawnBlocks();
    this.powerups = [];
    this.updateUI();
  }

  togglePause(){
    if(!this.running) return;
    this.paused = !this.paused;
    if(!this.paused){
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    }
    pauseBtn.textContent = this.paused ? 'Resume' : 'Pause';
  }

  loop(timestamp){
    if(!this.running) return;
    if(this.paused) return;
    const dt = (timestamp - this.lastTime) / 16.666; // ~60fps base
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    this.req = requestAnimationFrame(t => this.loop(t));
  }

  update(dt){
    // update ball
    if(!this.ball.stuck) this.ball.update();

    // wall collisions
    if(this.ball.x - this.ball.r <= 4){ this.ball.x = this.ball.r+4; this.ball.dx *= -1; }
    if(this.ball.x + this.ball.r >= WIDTH-4){ this.ball.x = WIDTH - this.ball.r - 4; this.ball.dx *= -1; }
    if(this.ball.y - this.ball.r <= 6){ this.ball.y = this.ball.r + 6; this.ball.dy *= -1; }

    // paddle collision
    if(circleRectCollide(this.ball, this.paddle)){
      // deflect angle depending on hit position
      const relative = (this.ball.x - (this.paddle.x + this.paddle.width/2)) / (this.paddle.width/2);
      const maxAngle = Math.PI * 0.4;
      const angle = relative * maxAngle;
      const speed = Math.hypot(this.ball.dx, this.ball.dy) || this.ball.speed;
      this.ball.dx = Math.sin(angle) * speed;
      this.ball.dy = -Math.abs(Math.cos(angle) * speed);
      this.ball.y = this.paddle.y - this.ball.r - 1;
      // small speed buff to keep game moving
      if(Math.abs(this.ball.dy) < 3.2) this.ball.dy = -3.2;
    }

    // blocks collisions
    this.blocks.forEach(b => {
      if(!b.alive) return;
      if(circleRectCollide(this.ball, b)){
        // determine side of collision (approx)
        const overlapX = (this.ball.x - (b.x + b.w/2)) / (b.w/2);
        const overlapY = (this.ball.y - (b.y + b.h/2)) / (b.h/2);
        if(Math.abs(overlapX) > Math.abs(overlapY)){
          this.ball.dx *= -1;
        } else {
          this.ball.dy *= -1;
        }

        b.hit();
        if(!b.alive){
          this.score += 50;
          // spawn powerup occasionally
          if(Math.random() < POWERUP_CHANCE){
            const types = Object.values(POWERUPS);
            const type = types[randInt(0, types.length-1)];
            this.powerups.push(new PowerUp(b.x + b.w/2, b.y + b.h/2, type));
          }
        } else {
          this.score += 20;
        }
        // small speed increase over time
        this.ball.dx *= 1.02;
        this.ball.dy *= 1.02;
      }
    });

    // update powerups
    this.powerups.forEach(p => {
      p.update();
      // paddle catch?
      if(p.alive && rectCircleCollide(this.paddle, p)){
        this.applyPowerUp(p.type);
        p.alive = false;
      }
    });
    // remove dead powerups and dead blocks
    this.powerups = this.powerups.filter(p => p.alive);
    this.blocks = this.blocks.filter(b => b.alive || (!b.alive && Math.random()>1)); // keep reference until next spawn

    // bottom (lose life)
    if(this.ball.y - this.ball.r > HEIGHT){
      this.lives -= 1;
      if(this.lives <= 0){
        this.gameOver();
        return;
      } else {
        this.ball.reset();
        this.ball.stuck = true;
        this.paddle.reset();
      }
    }

    // win condition: all blocks gone
    const aliveBlocks = this.blocks.filter(b => b.alive).length;
    if(aliveBlocks <= 0){
      this.levelUp();
    }

    // update UI
    this.updateUI();
  }

  applyPowerUp(type){
    if(type === POWERUPS.SPEED){
      this.ball.speedUp(1.25);
      this.ball.dx *= 1.15; this.ball.dy *= 1.15;
      this.score += 30;
    } else if(type === POWERUPS.WIDE){
      this.paddle.expand(1.5);
      setTimeout(()=> this.paddle.reset(), 12000);
      this.score += 20;
    } else if(type === POWERUPS.LIFE){
      this.lives = Math.min(this.lives + 1, 9);
      this.score += 80;
    }
  }

  levelUp(){
    this.level++;
    this.score += 200;
    this.paddle.reset();
    this.ball.reset();
    this.ball.stuck = true;
    this.spawnBlocks();
  }

  gameOver(){
    this.running = false;
    // update highscore
    if(this.score > highscore){
      highscore = this.score;
      localStorage.setItem(STORAGE_KEY, String(highscore));
      highscoreEl.textContent = highscore;
    }
    // show simple overlay
    setTimeout(()=> {
      showOverlay(`Game Over\nScore: ${this.score}\nLevel reached: ${this.level}`, () => { this.start(true); });
    }, 150);
  }

  updateUI(){
    scoreEl.textContent = this.score;
    livesEl.textContent = this.lives;
    levelEl.textContent = this.level;
  }

  render(){
    // clear
    ctx.clearRect(0,0,WIDTH,HEIGHT);
    // background grid
    renderBackground();

    // draw blocks
    this.blocks.forEach(b => b.draw(ctx));
    // draw powerups
    this.powerups.forEach(p => p.draw(ctx));
    // paddle
    this.paddle.draw(ctx);
    // ball
    this.ball.draw(ctx);
  }
}

// --- Collision helpers ---
function circleRectCollide(circle, rect){
  // rect: {x,y,w,h}
  const rx = rect.x, ry = rect.y, rw = rect.width || rect.w || rect.w, rh = rect.height || rect.h || rect.h;
  // normalize
  const rectX = rect.x !== undefined ? rect.x : rect.x;
  // find nearest point
  const nearestX = clamp(circle.x, rect.x, rect.x + rect.w);
  const nearestY = clamp(circle.y, rect.y, rect.y + rect.h);
  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;
  return (dx*dx + dy*dy) <= (circle.r * circle.r);
}

// rect-circle (paddle catches powerup): treat powerup as circle
function rectCircleCollide(rect, circle){
  const nearestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const nearestY = clamp(circle.y, rect.y, rect.y + rect.height);
  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;
  return dx*dx + dy*dy <= circle.r * circle.r;
}

// --- overlays ---
function showOverlay(text, onClose){
  // simple alert-like overlay
  const overlay = document.createElement('div');
  overlay.style.position='fixed';
  overlay.style.left=0; overlay.style.top=0; overlay.style.right=0; overlay.style.bottom=0;
  overlay.style.background='rgba(4,6,12,0.6)';
  overlay.style.display='flex'; overlay.style.alignItems='center'; overlay.style.justifyContent='center';
  overlay.style.zIndex=9999;

  const box = document.createElement('div');
  box.style.background='#0f1724';
  box.style.padding='18px';
  box.style.borderRadius='10px';
  box.style.boxShadow='0 10px 30px rgba(0,0,0,0.6)';
  box.style.color='#e6eef8';
  box.style.textAlign='center';
  box.innerHTML = `<pre style="font-size:16px;white-space:pre-wrap;">${text}</pre><br/>`;

  const btn = document.createElement('button');
  btn.textContent = 'Play Again';
  btn.style.padding = '8px 12px';
  btn.style.border = '0';
  btn.style.borderRadius='6px';
  btn.style.background = 'linear-gradient(180deg,#ff6b6b,#dd3e3e)';
  btn.style.color = '#fff';
  btn.addEventListener('click', () => {
    document.body.removeChild(overlay);
    if(onClose) onClose();
  });

  box.appendChild(btn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

// --- background render ---
function renderBackground(){
  // subtle grid
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.01)';
  for(let y=0;y<HEIGHT;y+=36){
    ctx.fillRect(0,y,WIDTH,0.6);
  }
  ctx.restore();
}

// --- initialize ---
function init(){
  game = new Game();
  // attach small resize handler to keep canvas pixel-ratio correct
  function fitCanvas(){
    const ratio = window.devicePixelRatio || 1;
    // maintain CSS size while scaling actual resolution for crispness
    const cssW = Math.min(window.innerWidth - 300, 900);
    const cssH = Math.min(window.innerHeight - 220, 600);
    // keep aspect 4:3 roughly
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.width = Math.floor(cssW * ratio);
    canvas.height = Math.floor(cssH * ratio);
    // after resize, adjust drawing scale
    ctx.setTransform(ratio,0,0,ratio,0,0);
  }
  fitCanvas();
  window.addEventListener('resize', fitCanvas);

  // start paused, allow user to press start
  game.render();
}

init();
