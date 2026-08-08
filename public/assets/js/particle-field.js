// Editorial anti-gravity particle field shared by archive and post pages.
(function () {
  var canvas = document.getElementById("particle-field") ||
    document.getElementById("bg-canvas");
  if (!canvas) return;

  var context = canvas.getContext("2d");
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var particles = [];
  var pointer = { x: -9999, y: -9999, active: false };
  var frame = 0;
  var running = false;
  var width = 0;
  var height = 0;
  var dpr = 1;
  var paletteLight = ["#148f99", "#2e63dd", "#68499b", "#171a1b"];
  var paletteDark = ["#55c7cf", "#7697ff", "#aa89df", "#e8e9e4"];

  function makeParticle(index) {
    var leftBias = Math.pow(Math.random(), 1.8);
    var x = width * (0.02 + leftBias * 0.83);
    var y = height * (0.06 + Math.random() * 0.88);
    return {
      x: x,
      y: y,
      homeX: x,
      homeY: y,
      vx: (Math.random() - 0.5) * 0.08,
      vy: -0.035 - Math.random() * 0.06,
      width: 1 + Math.random() * 4.4,
      height: 1 + Math.random() * 1.7,
      rotation: Math.random() * Math.PI,
      colorIndex: index % 4,
      alpha: 0.14 + Math.random() * 0.46
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    var count = width < 720 ? 68 : Math.min(175, Math.round(width / 9));
    particles = Array.from({ length: count }, function (_, index) {
      return makeParticle(index);
    });
  }

  function update(particle) {
    if (pointer.active) {
      var dx = particle.x - pointer.x;
      var dy = particle.y - pointer.y;
      var distanceSquared = dx * dx + dy * dy;
      var radius = width < 720 ? 92 : 150;

      if (distanceSquared < radius * radius && distanceSquared > 1) {
        var distance = Math.sqrt(distanceSquared);
        var force = (1 - distance / radius) * 0.78;
        particle.vx += (dx / distance) * force;
        particle.vy += (dy / distance) * force;
      }
    }

    particle.vx += (particle.homeX - particle.x) * 0.00024;
    particle.vy += (particle.homeY - particle.y) * 0.00018 - 0.0015;
    particle.vx *= 0.965;
    particle.vy *= 0.965;
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.y < -24) {
      particle.y = height + 24;
      particle.homeY = height * (0.08 + Math.random() * 0.84);
    }
  }

  function draw() {
    if (!running) return;

    context.clearRect(0, 0, width, height);
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    var palette = dark ? paletteDark : paletteLight;

    particles.forEach(function (particle) {
      if (!reducedMotion) update(particle);
      context.save();
      context.globalAlpha = particle.alpha;
      context.fillStyle = palette[particle.colorIndex];
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.fillRect(
        -particle.width / 2,
        -particle.height / 2,
        particle.width,
        particle.height
      );
      context.restore();
    });

    if (!reducedMotion && !document.hidden) {
      frame = requestAnimationFrame(draw);
    }
  }

  function start() {
    if (running) return;
    running = true;
    cancelAnimationFrame(frame);
    draw();
  }

  function stop() {
    running = false;
    cancelAnimationFrame(frame);
    context.clearRect(0, 0, width, height);
  }

  function setPointer(event) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  }

  window.addEventListener("pointermove", setPointer, { passive: true });
  window.addEventListener("pointerdown", setPointer, { passive: true });
  window.addEventListener("pointerleave", function () {
    pointer.active = false;
  });
  window.addEventListener("resize", function () {
    cancelAnimationFrame(frame);
    resize();
    if (running) draw();
  }, { passive: true });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && running) {
      cancelAnimationFrame(frame);
      draw();
    }
  });

  resize();
  window.particleField = { start: start, stop: stop };
  start();
}());
