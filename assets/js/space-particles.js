// Cyberpunk Space Warp / Starfield Effect
// Responsive, lightweight, native JS.
(function () {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let DPR = window.devicePixelRatio || 1;
    let W = window.innerWidth;
    let H = window.innerHeight;
    let cx = W / 2;
    let cy = H / 2;

    // Configuration
    const CONFIG = {
        count: 400,           // Max particle count
        zMax: 1000,           // Max depth (spawn distance)
        fov: 300,             // Field of view
        speedBase: 2,         // Base speed
        speedVar: 3,          // Speed variation
        colors: ['#00FFFF', '#1E90FF', '#9400D3'], // Cyan, Deep Blue, Bright Purple
        streakChance: 0.2,    // Chance for a particle to be a streak
    };

    function resize() {
        DPR = window.devicePixelRatio || 1;
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W * DPR;
        canvas.height = H * DPR;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.scale(DPR, DPR);
        cx = W / 2;
        cy = H / 2;

        // Adjust count based on screen area
        const area = W * H;
        CONFIG.count = Math.min(600, Math.max(150, Math.floor(area / 2000)));
    }

    // Mouse State
    const mouse = { x: cx, y: cy, down: false, active: false };

    window.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        mouse.active = true;
    });
    window.addEventListener('mousedown', () => mouse.down = true);
    window.addEventListener('mouseup', () => mouse.down = false);
    window.addEventListener('keydown', e => { if (e.key === 'Alt') mouse.down = true; });
    window.addEventListener('keyup', e => { if (e.key === 'Alt') mouse.down = false; });
    window.addEventListener('resize', resize);

    class Particle {
        constructor() {
            this.reset(true);
        }

        reset(randomZ = false) {
            // Random position in a wide cone
            // We use a large range so they don't all clump in the center
            const spread = 2.0;
            this.x = (Math.random() - 0.5) * W * spread;
            this.y = (Math.random() - 0.5) * H * spread;

            // Z represents depth. High Z = far away.
            this.z = randomZ ? Math.random() * CONFIG.zMax : CONFIG.zMax;

            this.speed = CONFIG.speedBase + Math.random() * CONFIG.speedVar;
            this.color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
            this.sizeBase = 0.8 + Math.random() * 2.0;
            this.isStreak = Math.random() < CONFIG.streakChance;
            this.alpha = 0;
        }

        update(dt) {
            // Move towards camera
            this.z -= this.speed * (dt * 60);

            // Reset if passed camera
            if (this.z <= 1) {
                this.reset();
                return;
            }

            // 3D Projection
            const scale = CONFIG.fov / this.z;
            let sx = cx + this.x * scale;
            let sy = cy + this.y * scale;

            // Mouse Interaction (Gravity/Repulsion)
            if (mouse.active) {
                const dx = sx - mouse.x;
                const dy = sy - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const radius = 250; // Interaction radius

                if (dist < radius) {
                    // Calculate force (stronger when closer)
                    const force = (1 - dist / radius) * 80;
                    const angle = Math.atan2(dy, dx);

                    // Alt/Click = Attract (-1), Default = Repel (1)
                    const dir = mouse.down ? -1 : 1;

                    sx += Math.cos(angle) * force * dir;
                    sy += Math.sin(angle) * force * dir;
                }
            }

            this.sx = sx;
            this.sy = sy;
            this.scale = scale;

            // Fade in/out
            // Fade in quickly at start, fade out if very close to edges (optional)
            const progress = 1 - (this.z / CONFIG.zMax);
            this.alpha = Math.min(1, progress * 3);
        }

        draw(ctx) {
            if (this.z > CONFIG.zMax || this.z <= 1) return;

            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.strokeStyle = this.color;

            const r = this.sizeBase * this.scale;

            // Calculate distance from center for streak stretching
            const dx = this.sx - cx;
            const dy = this.sy - cy;
            const distFromCenter = Math.sqrt(dx * dx + dy * dy);

            // Stretch based on speed (scale) and distance from center
            // Particles at edges move visually faster -> longer streaks
            const stretch = Math.max(1, this.scale * distFromCenter * 0.02);

            if (this.isStreak && stretch > 1.5) {
                // Draw Streak
                const angle = Math.atan2(dy, dx);
                const tailLen = Math.min(150, r * stretch * 2);

                ctx.beginPath();
                // Start at current pos
                ctx.moveTo(this.sx, this.sy);
                // Line back towards center
                ctx.lineTo(
                    this.sx - Math.cos(angle) * tailLen,
                    this.sy - Math.sin(angle) * tailLen
                );
                ctx.lineWidth = r;
                ctx.lineCap = 'round';
                ctx.stroke();
            } else {
                // Draw Glowy Circle
                ctx.beginPath();
                ctx.arc(this.sx, this.sy, r, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Init
    resize();
    const particles = [];
    for (let i = 0; i < CONFIG.count; i++) {
        particles.push(new Particle());
    }

    // Loop
    let lastTime = performance.now();
    function loop() {
        const now = performance.now();
        const dt = Math.min(0.1, (now - lastTime) / 1000);
        lastTime = now;

        // Clear with slight fade for trails? No, user wants clean background usually, 
        // but "Glow" is requested.
        ctx.clearRect(0, 0, W * DPR, H * DPR);

        // Background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W * DPR, H * DPR);

        // Additive blending for glow effect
        ctx.globalCompositeOperation = 'lighter';

        for (const p of particles) {
            p.update(dt);
            p.draw(ctx);
        }

        ctx.globalCompositeOperation = 'source-over';
        requestAnimationFrame(loop);
    }

    loop();

})();
