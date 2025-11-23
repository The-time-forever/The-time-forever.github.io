// Lightweight space / starfield particles for a canvas background
// Designed to be responsive and efficient. No external libs.
(function(){
  const canvas = document.getElementById('bg-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');

  let DPR = Math.max(1, window.devicePixelRatio || 1);
  let W = 0, H = 0, cx = 0, cy = 0;

  function resize(){
    DPR = Math.max(1, window.devicePixelRatio || 1);
    W = canvas.width = Math.floor(window.innerWidth * DPR);
    H = canvas.height = Math.floor(window.innerHeight * DPR);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    cx = W/2; cy = H/2;
    const area = (W/DPR) * (H/DPR);
    maxParticles = Math.min(600, Math.max(80, Math.floor(area / 1500)));
  }

  // particle storage
  let particles = [];
  let maxParticles = 200;

  const palette = [
    {r:120,g:255,b:255}, // cyan
    {r:100,g:180,b:255}, // blue
    {r:255,g:255,b:255}  // white
  ];

  function rand(min,max){ return Math.random()*(max-min)+min }

  function createParticle(x,y,initial){
    const depth = Math.random(); // 0..1, smaller = farther
    const size = Math.pow(1 - depth, 1.5) * rand(0.8, 3.8) * DPR;
    // initial velocity — by default radiate from center
    let angle = Math.atan2(y - cy, x - cx);
    let speed = initial ? rand(0.2, 1.8) * (1 - depth) : rand(-0.2,0.2);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    return {
      x, y, vx, vy, size, depth,
      alpha: rand(0.2, 1.0) * (1 - depth*0.6)
    };
  }

  function seedParticles(){
    particles.length = 0;
    for(let i=0;i<maxParticles;i++){
      const r = rand(0, Math.min(W,H)*0.35);
      const a = rand(0, Math.PI*2);
      const x = cx + Math.cos(a)*r;
      const y = cy + Math.sin(a)*r;
      particles.push(createParticle(x,y,true));
    }
  }

  // mouse interactivity
  const mouse = {x:0,y:0,down:false,moved:false};
  let lastMoveTime = 0;

  window.addEventListener('mousemove', (e)=>{
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * DPR;
    mouse.y = (e.clientY - rect.top) * DPR;
    mouse.moved = true;
    lastMoveTime = performance.now();
    const spawn = Math.min(6, Math.floor(6 * DPR));
    for(let i=0;i<spawn;i++){
      if(particles.length < maxParticles) particles.push(createParticle(mouse.x + rand(-6,6), mouse.y + rand(-6,6), true));
    }
  }, {passive:true});

  window.addEventListener('resize', ()=>{
    resize();
    seedParticles();
  });

  // hold Alt to attract, otherwise mouse repels
  window.addEventListener('keydown',(e)=>{ if(e.key === 'Alt') mouse.down = true; });
  window.addEventListener('keyup',(e)=>{ if(e.key === 'Alt') mouse.down = false; });

  function update(dt){
    const now = performance.now();
    const moving = (now - lastMoveTime) < 2000 && mouse.moved;

    for(let i=particles.length-1;i>=0;i--){
      const p = particles[i];
      p.vx += rand(-0.02,0.02) * (1 - p.depth);
      p.vy += rand(-0.02,0.02) * (1 - p.depth);

      const dx = p.x - cx, dy = p.y - cy;
      const dist = Math.sqrt(dx*dx + dy*dy) + 0.0001;
      const push = 0.0006 * (1 - p.depth);
      p.vx += (dx/dist) * push * dt * 60;
      p.vy += (dy/dist) * push * dt * 60;

      if(moving){
        const mx = mouse.x, my = mouse.y;
        const mdx = p.x - mx, mdy = p.y - my;
        const md = Math.sqrt(mdx*mdx + mdy*mdy) + 0.0001;
        const influence = Math.max(0, 1 - md / (120 * DPR));
        if(influence>0){
          const strength = (mouse.down ? -1 : 1) * 0.12 * influence * (1 - p.depth);
          p.vx += (mdx / md) * strength;
          p.vy += (mdy / md) * strength;
        }
      }

      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;

      if(p.x < -50*DPR || p.x > W + 50*DPR || p.y < -50*DPR || p.y > H + 50*DPR){
        if(Math.random() < 0.5) particles[i] = createParticle(cx + rand(-8*DPR,8*DPR), cy + rand(-8*DPR,8*DPR), true);
        else particles.splice(i,1);
      }
    }

    while(particles.length < maxParticles){
      const angle = Math.random()*Math.PI*2;
      const r = rand(0, Math.min(W,H)*0.08);
      const x = cx + Math.cos(angle)*r + rand(-10,10);
      const y = cy + Math.sin(angle)*r + rand(-10,10);
      particles.push(createParticle(x,y,true));
    }
  }

  const gradientCache = {};
  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0,0,W,H);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for(const p of particles){
      const key = Math.max(1, Math.round(p.size));
      let g = gradientCache[key];
      if(!g){
        g = ctx.createRadialGradient(0,0,key,0,0,key*3);
        g.addColorStop(0, `rgba(255,255,255,1)`);
        g.addColorStop(0.15, `rgba(200,230,255,0.9)`);
        g.addColorStop(0.45, `rgba(100,160,255,0.25)`);
        g.addColorStop(1, `rgba(0,0,0,0)`);
        gradientCache[key] = g;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0,0,p.size*2,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  let last = performance.now();
  function loop(){
    const now = performance.now();
    const dt = Math.min(0.05, (now - last)/1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  resize();
  seedParticles();
  loop();

})();
