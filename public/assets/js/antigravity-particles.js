// ============================================================================
// omp 复现 · Antigravity 背景粒子系统（纯 WebGL2，零依赖）
// ----------------------------------------------------------------------------
// 对照源：MainParticlesComponent.js（2026-07-31 抓取，已确认与线上 chunk 逐字节一致）
// 架构：GPGPU ping-pong FBO（256×256 RGBA16F）× 2 + gl.POINTS 单次绘制
//   - 模拟 pass：fragment shader 内逐粒子（逐 texel）更新位置/尺寸/速度
//   - 渲染 pass：每粒子一个 POINT，顶点着色器从位置纹理取数
// 移植说明：
//   - three.js 的 GLSL1 着色器已按 WebGL2 语法迁移为 GLSL ES 3.00
//     （attribute→in、varying→in/out、texture2D→texture、gl_FragColor→out）
//   - 源码中的 `#ifdef SRGB_TRANSFER` 分支在站点 bundle 里从未被定义（死代码），故省略
//   - 源码 `d.enabled=!1`（ColorManagement.enabled=false）等价于颜色值直通，无色彩管理
// ============================================================================

'use strict';

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------
const SIM_SIZE = 256; // 模拟纹理边长，65,536 粒子

// ---------------------------------------------------------------------------
// 工具：1D 值噪声（对应 three 的 SimplexNoise.getVal，bundle 中的 Ol 类）
// ---------------------------------------------------------------------------
class ValueNoise1D {
  constructor(random = Math.random) {
    this.MAX_VERTICES = 256;
    this.MAX_VERTICES_MASK = this.MAX_VERTICES - 1;
    this.amplitude = 1;
    this.scale = 1;
    this.r = [];
    for (let i = 0; i < this.MAX_VERTICES; i++) this.r.push(random());
  }
  getVal(x) {
    const t = x * this.scale;
    const n = Math.floor(t);
    const r = t - n;
    const i = r * r * (3 - 2 * r); // smoothstep
    const a = ((n % this.MAX_VERTICES_MASK) + this.MAX_VERTICES_MASK) % this.MAX_VERTICES_MASK;
    const o = (a + 1) % this.MAX_VERTICES_MASK;
    return this.lerp(this.r[a], this.r[o], i) * this.amplitude;
  }
  lerp(a, b, t) {
    return a * (1 - t) + b * t;
  }
}

// ---------------------------------------------------------------------------
// 工具：线性映射（对应源码中的 j=(e,t,n,r,i)=>(e-t)*(i-r)/(n-t)+r）
// ---------------------------------------------------------------------------
function mapRange(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

// ---------------------------------------------------------------------------
// Poisson Disk 采样（Bridson 蓝噪声，对应站点 poisson-disk-sampling 库）
// ---------------------------------------------------------------------------
function poissonDisk({ shape, minDistance, maxDistance, tries = 20, random = Math.random }) {
  const [width, height] = shape;
  // Bridson 网格：cell = r/√2 保证每个单元至多一个点（r = minDistance）
  const cell = minDistance / Math.SQRT2;
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const grid = new Int32Array(cols * rows).fill(-1);
  const points = [];
  const active = [];

  const minDist2 = minDistance * minDistance;

  const tooClose = (px, py) => {
    const cx = Math.floor(px / cell);
    const cy = Math.floor(py / cell);
    for (let gy = cy - 2; gy <= cy + 2; gy++) {
      for (let gx = cx - 2; gx <= cx + 2; gx++) {
        if (gx < 0 || gx >= cols || gy < 0 || gy >= rows) continue;
        const q = grid[gy * cols + gx];
        if (q < 0) continue;
        const dx = points[q][0] - px;
        const dy = points[q][1] - py;
        if (dx * dx + dy * dy < minDist2) return true;
      }
    }
    return false;
  };

  const addPoint = (px, py) => {
    const idx = points.length;
    points.push([px, py]);
    grid[Math.floor(py / cell) * cols + Math.floor(px / cell)] = idx;
    active.push(idx);
  };

  addPoint(random() * width, random() * height);

  while (active.length > 0) {
    const ai = Math.floor(random() * active.length);
    const p = points[active[ai]];
    let found = false;
    for (let k = 0; k < tries; k++) {
      const theta = random() * Math.PI * 2;
      const rad = minDistance + random() * (maxDistance - minDistance);
      const qx = p[0] + Math.cos(theta) * rad;
      const qy = p[1] + Math.sin(theta) * rad;
      if (qx < 0 || qx >= width || qy < 0 || qy >= height) continue;
      if (tooClose(qx, qy)) continue;
      addPoint(qx, qy);
      found = true;
      break;
    }
    if (!found) {
      active[ai] = active[active.length - 1];
      active.pop();
    }
  }
  return points;
}

// ---------------------------------------------------------------------------
// Simplex 噪声 GLSL（逐字节提取自站点 three bundle 的 bl.noise，含 2D/3D/4D）
// ---------------------------------------------------------------------------
const NOISE_GLSL = `
  // MATHS
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  float permute(float x){return floor(mod(((x*34.0)+1.0)*x, 289.0));}

  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  float taylorInvSqrt(float r){return 1.79284291400159 - 0.85373472095314 * r;}

  // SIMPLEX NOISES
  // Simplex 2D noise
  //
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
            -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  //	Simplex 3D Noise
  //	by Ian McEwan, Ashima Arts
  //
  float snoise(vec3 v){
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;

  // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    //  x0 = x0 - 0. + 0.0 * C
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1. + 3.0 * C.xxx;

  // Permutations
    i = mod(i, 289.0 );
    vec4 p = permute( permute( permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  // Gradients
  // ( N*N points uniformly over a square, mapped onto an octahedron.)
    float n_ = 1.0/7.0; // N=7
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

  //Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

  // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                  dot(p2,x2), dot(p3,x3) ) );
  }


  //	Simplex 4D Noise
  //	by Ian McEwan, Ashima Arts
  //
  vec4 grad4(float j, vec4 ip){
    const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
    vec4 p,s;

    p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
    p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
    s = vec4(lessThan(p, vec4(0.0)));
    p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www;

    return p;
  }

  float snoise(vec4 v){
    const vec2  C = vec2( 0.138196601125010504,  // (5 - sqrt(5))/20  G4
                          0.309016994374947451); // (sqrt(5) - 1)/4   F4
  // First corner
    vec4 i  = floor(v + dot(v, C.yyyy) );
    vec4 x0 = v -   i + dot(i, C.xxxx);

  // Other corners

  // Rank sorting originally contributed by Bill Licea-Kane, AMD (formerly ATI)
    vec4 i0;

    vec3 isX = step( x0.yzw, x0.xxx );
    vec3 isYZ = step( x0.zww, x0.yyz );
  //  i0.x = dot( isX, vec3( 1.0 ) );
    i0.x = isX.x + isX.y + isX.z;
    i0.yzw = 1.0 - isX;

  //  i0.y += dot( isYZ.xy, vec2( 1.0 ) );
    i0.y += isYZ.x + isYZ.y;
    i0.zw += 1.0 - isYZ.xy;

    i0.z += isYZ.z;
    i0.w += 1.0 - isYZ.z;

    // i0 now contains the unique values 0,1,2,3 in each channel
    vec4 i3 = clamp( i0, 0.0, 1.0 );
    vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );
    vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );

    //  x0 = x0 - 0.0 + 0.0 * C
    vec4 x1 = x0 - i1 + 1.0 * C.xxxx;
    vec4 x2 = x0 - i2 + 2.0 * C.xxxx;
    vec4 x3 = x0 - i3 + 3.0 * C.xxxx;
    vec4 x4 = x0 - 1.0 + 4.0 * C.xxxx;

  // Permutations
    i = mod(i, 289.0);
    float j0 = permute( permute( permute( permute(i.w) + i.z) + i.y) + i.x);
    vec4 j1 = permute( permute( permute( permute (
              i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))
            + i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))
            + i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))
            + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));
  // Gradients
  // ( 7*7*6 points uniformly over a cube, mapped onto a 4-octahedron.)
  // 7*7*6 = 294, which is close to the ring size 17*17 = 289.

    vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;

    vec4 p0 = grad4(j0,   ip);
    vec4 p1 = grad4(j1.x, ip);
    vec4 p2 = grad4(j1.y, ip);
    vec4 p3 = grad4(j1.z, ip);
    vec4 p4 = grad4(j1.w, ip);

  // Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    p4 *= taylorInvSqrt(dot(p4,p4));

  // Mix contributions from the five corners
    vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
    vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)            ), 0.0);
    m0 = m0 * m0;
    m1 = m1 * m1;
    return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 )))
                + dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;

  }
`;

// ---------------------------------------------------------------------------
// 模拟 pass 着色器
// 片段着色器与源码 MainParticlesComponent.js init() 中 fragmentShader 逐行一致
// ---------------------------------------------------------------------------
const SIM_VS = `#version 300 es
void main() {
    // 全屏三角形，等价于源码中的 PlaneGeometry(2,2) 全屏四边形
    vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
    gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const SIM_FS = `#version 300 es
precision highp float;
uniform sampler2D uPosition;
uniform sampler2D uPosRefs;
uniform vec2 uRingPos;
uniform float uTime;
uniform float uDeltaTime;
uniform float uRingRadius;
uniform float uRingWidth;
uniform float uRingWidth2;
uniform float uRingDisplacement;
out vec4 outColor;
${NOISE_GLSL}
void main() {
    vec2 simTexCoords = gl_FragCoord.xy / vec2(${SIM_SIZE}.0, ${SIM_SIZE}.0);
    vec4 pFrame = texture(uPosition, simTexCoords);
    float scale = pFrame.z;
    float velocity = pFrame.w;
    vec2 refPos = texture(uPosRefs, simTexCoords).xy;
    float time = uTime * .5;
    vec2 curentPos = refPos;
    vec2 pos = pFrame.xy;
    pos *= .8;
    float dist = distance(curentPos.xy, uRingPos);
    float noise0 = snoise(vec3(curentPos.xy * .2 + vec2(18.4924, 72.9744), time * 0.5));
    float dist1 = distance(curentPos.xy + (noise0 * .005), uRingPos);
    float t = smoothstep(uRingRadius - (uRingWidth * 2.), uRingRadius, dist) - smoothstep(uRingRadius, uRingRadius + uRingWidth, dist1);
    float t2 = smoothstep(uRingRadius - (uRingWidth2 * 2.), uRingRadius, dist) - smoothstep(uRingRadius, uRingRadius + uRingWidth2, dist1);
    float t3 = smoothstep(uRingRadius + uRingWidth2, uRingRadius, dist);
    t = pow(t, 2.);
    t2 = pow(t2, 3.);
    t += t2 * 3.;
    t += t3 * .4;
    t += snoise(vec3(curentPos.xy * 30. + vec2(11.4924, 12.9744), time * 0.5)) * t3 * .5;
    float nS = snoise(vec3(curentPos.xy * 2. + vec2(18.4924, 72.9744), time * 0.5));
    t += pow((nS + 1.5) * .5, 2.) * .6;
    float noise1 = snoise(vec3(curentPos.xy * 4. + vec2(88.494, 32.4397), time * 0.35));
    float noise2 = snoise(vec3(curentPos.xy * 4. + vec2(50.904, 120.947), time * 0.35));
    float noise3 = snoise(vec3(curentPos.xy * 20. + vec2(18.4924, 72.9744), time * .5));
    float noise4 = snoise(vec3(curentPos.xy * 20. + vec2(50.904, 120.947), time * .5));
    vec2 disp = vec2(noise1, noise2) * .03;
    disp += vec2(noise3, noise4) * .005;
    disp.x += sin((refPos.x * 20.) + (time * 4.)) * .02 * clamp(dist, 0., 1.);
    disp.y += cos((refPos.y * 20.) + (time * 3.)) * .02 * clamp(dist, 0., 1.);
    pos -= (uRingPos - (curentPos + disp)) * pow(t2, .75) * uRingDisplacement;
    float scaleDiff = t - scale;
    scaleDiff *= .2;
    scale += scaleDiff;
    vec2 finalPos = curentPos + disp + (pos * .25);
    velocity *= .5;
    velocity += scale * .25;
    vec4 frame = vec4(finalPos, scale, velocity);
    outColor = frame;
}`;

// ---------------------------------------------------------------------------
// 渲染 pass 着色器
// 与源码 setupRenderMaterial() 中的 vertexShader / fragmentShader 一致
// （顶点着色器原样使用 modelViewMatrix / projectionMatrix，此处以自定义 uniform 提供）
// ---------------------------------------------------------------------------
const RENDER_VS = `#version 300 es
precision highp float;
in vec4 seeds;
in vec2 uv;
uniform sampler2D uPosition;
uniform float uParticleScale;
uniform float uPixelRatio;
uniform mat4 uModelViewMatrix;   // 源码内置 modelViewMatrix（含 mesh.scale 5）
uniform mat4 uProjectionMatrix;  // 源码内置 projectionMatrix
out vec4 vSeeds;
out float vVelocity;
out vec2 vLocalPos;
out vec2 vScreenPos;
out float vScale;
void main() {
    vec4 pos = texture(uPosition, uv);
    vSeeds = seeds;
    vVelocity = pos.w;
    vScale = pos.z;
    vLocalPos = pos.xy;
    vec4 viewSpace = uModelViewMatrix * vec4(vec3(pos.xy, 0.), 1.0);
    gl_Position = uProjectionMatrix * viewSpace;
    vScreenPos = gl_Position.xy;
    gl_PointSize = ((vScale * 7.) * (uPixelRatio * 0.5) * uParticleScale);
}`;

const RENDER_FS = `#version 300 es
precision highp float;
in vec4 vSeeds;
in vec2 vScreenPos;
in vec2 vLocalPos;
in float vScale;
in float vVelocity;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec2 uRingPos;
uniform vec2 uRez;
uniform float uAlpha;
uniform float uTime;
uniform int uColorScheme;
out vec4 outColor;
${NOISE_GLSL}
#define PI 3.1415926535897932384626433832795

float sdRoundBox( in vec2 p, in vec2 b, in vec4 r )
{
    r.xy = (p.x>0.0)?r.xy : r.zw;
    r.x  = (p.y>0.0)?r.x  : r.y;
    vec2 q = abs(p)-b+r.x;
    return min(max(q.x,q.y),0.0) + length(max(q,0.0)) - r.x;
}

// rotate uv by angle
vec2 rotate(vec2 v, float a) {
    float s = sin(a);
    float c = cos(a);
    mat2 m = mat2(c, s, -s, c);
    return m * v;
}

void main() {
    float uBorderSize = 0.2;
    vec2 center = vec2(.48, .4); // 源码遗留死代码
    float ratio = uRez.x / uRez.y;

    // Noise
    float noiseAngle = snoise(vec3(vLocalPos * 10. + vec2(18.4924, 72.9744), uTime * .85));
    float noiseColor = snoise(vec3(vLocalPos * 2. + vec2(74.664, 91.556), uTime * .5));
    noiseColor = (noiseColor + 1.) * .5;

    // get angle between particle and ring
    float angle = atan(vLocalPos.y - uRingPos.y, vLocalPos.x - uRingPos.x);

    vec2 uv = gl_PointCoord.xy;
    uv -= vec2(0.5);
    uv.y *= -1.;
    uv = rotate(uv, -angle + (noiseAngle * .5));

    vec2 tuv = vScreenPos;       // 源码遗留死代码（从未被使用）
    tuv = rotate(tuv, uTime * 1.);
    tuv.y *= 1./ratio;
    tuv += .5;

    float h = 0.8; // adjust position of middleColor
    float progress = smoothstep(0., .75, pow(noiseColor, 2.));
    vec3 col = mix(mix(uColor1, uColor2, progress/h), mix(uColor2, uColor3, (progress - h)/(1.0 - h)), step(h, progress));
    vec3 color = col;

    float dist = sqrt(dot(uv, uv));

    float dr = .5;
    float t = smoothstep(dr+(uBorderSize + .0001), dr-uBorderSize, dist); // 源码遗留死代码
    t = clamp(t, 0., 1.);

    float rounded = sdRoundBox(uv, vec2(0.5, 0.2), vec4(.25));
    rounded = smoothstep(.1, 0., rounded);

    float a = uAlpha * rounded * smoothstep(0.1, 0.2, vScale);

    if(a < 0.01){
        discard;
    }

    color = clamp(color, 0., 1.);
    color = mix(color, color * clamp(vVelocity, 0., 1.), float(uColorScheme));

    outColor = vec4(color, clamp(a, 0., 1.));
}`;

// ---------------------------------------------------------------------------
// WebGL 工具
// ---------------------------------------------------------------------------
function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error('Shader compile error: ' + gl.getShaderInfoLog(shader));
  }
  return shader;
}

function createProgram(gl, vsSource, fsSource) {
  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, vsSource));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fsSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error('Program link error: ' + gl.getProgramInfoLog(program));
  }
  return program;
}

// 列主序 mat4（与 gl-matrix 约定一致）
function mat4Perspective(out, fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2);
  out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
  out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
  out[8] = 0; out[9] = 0; out[10] = (far + near) / (near - far); out[11] = -1;
  out[12] = 0; out[13] = 0; out[14] = (2 * far * near) / (near - far); out[15] = 0;
  return out;
}

// view(T(0,0,-3.1)) × model(scale(5,5,5)) —— 对应源码
//   camera.position.z = 3.1；this.mesh.scale.set(5,5,5)
function mat4ModelView(out) {
  out[0] = 5; out[1] = 0; out[2] = 0; out[3] = 0;
  out[4] = 0; out[5] = 5; out[6] = 0; out[7] = 0;
  out[8] = 0; out[9] = 0; out[10] = 5; out[11] = 0;
  out[12] = 0; out[13] = 0; out[14] = -3.1; out[15] = 1;
  return out;
}

function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255];
}

// 共享鼠标光标（对应站点 bundle 的 Mouse 模块 w.cursor：原始 clientX/Y，无平滑）
const sharedCursor = (() => {
  const cursor = { x: 0, y: 0 };
  if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', (e) => {
      cursor.x = e.clientX;
      cursor.y = e.clientY;
    });
  }
  return cursor;
})();

// ---------------------------------------------------------------------------
// 粒子组件（对应源码 M 类 + N 类）
// ---------------------------------------------------------------------------
class AntigravityParticles {
  constructor(options) {
    this.options = options;
    this.container = options.container;
    this.theme = options.theme || 'dark';
    this.pixelRatio = options.pixelRatio || (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1;
    this.particlesScale = options.particlesScale || 1;
    this.density = options.density || 200;
    this.interactive = options.interactive !== false;

    // 与源码 initScene() 相同的配色
    this.colorScheme = this.theme === 'dark' ? 0 : 1;
    this.colors = options.colors || (this.theme === 'dark'
      ? ['#7189ff', '#3074f9', '#000000']
      : ['#2c64ed', '#f84242', '#ffcf03']);
    this.background = options.background || (this.theme === 'dark' ? [0, 0, 0] : [1, 1, 1]);

    // 与源码相同的环参数（HTML data-* 属性可覆盖）
    this.ringWidth = options.ringWidth || 0.107;
    this.ringWidth2 = options.ringWidth2 || 0.05;
    this.ringDisplacement = options.ringDisplacement || 0.15;

    this.ringPos = { x: 0, y: 0 };
    this.cursorPos = { x: 0, y: 0 };
    this.intersectionPoint = [0, 0];
    this.isIntersecting = false;
    this.everRendered = false;

    this.time = 0;
    this.lastTime = typeof performance !== 'undefined' ? performance.now() : 0;
    this.dt = 0;
    this.isPaused = false;
    this.noise = new ValueNoise1D();

    this.canvas = document.createElement('canvas');
    this.container.appendChild(this.canvas);
    this.gl = this.canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
      stencil: false,
      depth: true,
      precision: 'highp',
    });
    if (!this.gl) throw new Error('WebGL2 不可用');
    this.gl.disable(this.gl.DEPTH_TEST);

    this.projection = new Float32Array(16);
    this.modelView = new Float32Array(16);

    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);

    this.resize();
    this.initSim();
    this.initRender();
  }

  resize() {
    const w = this.container.offsetWidth;
    const h = this.container.offsetHeight;
    // 设备像素 = CSS 像素 × dpr（对应源码 renderer.setSize + setPixelRatio）
    this.canvas.width = Math.max(1, Math.round(w * this.pixelRatio));
    this.canvas.height = Math.max(1, Math.round(h * this.pixelRatio));
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    // PerspectiveCamera(40, aspect, 0.1, 1000)，position.z = 3.1
    mat4Perspective(this.projection, (40 * Math.PI) / 180, this.canvas.width / this.canvas.height, 0.1, 1000);
    mat4ModelView(this.modelView);
    this.particleScale = (this.canvas.width / this.pixelRatio / 2000) * this.particlesScale;
  }

  // ---- 初始分布 + 模拟 pass（对应源码 createPoints / createDataTexturePosition / init） ----
  initSim() {
    const gl = this.gl;

    // 1. Poisson Disk 蓝噪声（shape 500×500，min/maxDistance 由 density 线性映射）
    const minDist = mapRange(this.density, 0, 300, 10, 2);
    const maxDist = mapRange(this.density, 0, 300, 11, 3);
    const points = poissonDisk({ shape: [500, 500], minDistance: minDist, maxDistance: maxDist, tries: 20 });
    this.count = points.length;

    // 2. 中心化 [-250, 250] → 缩放至 [-1, 1]，写入 256×256 RGBA32F 源纹理
    const data = new Float32Array(SIM_SIZE * SIM_SIZE * 4);
    for (let i = 0; i < points.length; i++) {
      data[i * 4 + 0] = (points[i][0] - 250) / 250;
      data[i * 4 + 1] = (points[i][1] - 250) / 250;
      data[i * 4 + 2] = 0; // scale
      data[i * 4 + 3] = 0; // velocity
    }
    this.posTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.posTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, SIM_SIZE, SIM_SIZE, 0, gl.RGBA, gl.FLOAT, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // 3. 探测可渲染的浮点纹理格式：
    //    首选 RGBA16F（three r152+ 渲染目标默认格式，与站点一致，WebGL2 规范核心可渲染）；
    //    若驱动/软件渲染不支持，回退 RGBA32F + EXT_color_buffer_float（站点同样请求该扩展）
    this.rtFormat = this.probeRenderableFormat();

    // 4. 两张 ping-pong 渲染目标
    this.rt = [this.createRenderTarget(), this.createRenderTarget()];

    // 初始清空两个 RT（对应源码 init() 中的 setClearColor(0,0) + clear）
    gl.clearColor(0, 0, 0, 0);
    for (const rt of this.rt) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, rt.framebuffer);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // 5. 模拟程序
    this.simProgram = createProgram(gl, SIM_VS, SIM_FS);
    this.simUniforms = {};
    for (const name of ['uPosition', 'uPosRefs', 'uRingPos', 'uRingRadius', 'uDeltaTime', 'uRingWidth', 'uRingWidth2', 'uRingDisplacement', 'uTime']) {
      this.simUniforms[name] = gl.getUniformLocation(this.simProgram, name);
    }
  }

  // 探测可渲染的浮点纹理格式（返回 internalFormat/type/label）
  // 注意：部分实现（软件渲染/旧驱动）对 null 分配的半浮点纹理返回 FRAMEBUFFER_INCOMPLETE_ATTACHMENT，
  // 因此探测与创建都显式上传数据（0 值）
  probeRenderableFormat() {
    const gl = this.gl;
    const candidates = [
      { internal: gl.RGBA16F, type: gl.HALF_FLOAT, label: 'RGBA16F', data: () => new Uint16Array(SIM_SIZE * SIM_SIZE * 4) },
    ];
    const ext = gl.getExtension('EXT_color_buffer_float');
    if (ext) {
      candidates.push({ internal: gl.RGBA32F, type: gl.FLOAT, label: 'RGBA32F(+EXT_color_buffer_float)', data: () => new Float32Array(SIM_SIZE * SIM_SIZE * 4) });
    }
    for (const c of candidates) {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, c.internal, SIM_SIZE, SIM_SIZE, 0, gl.RGBA, c.type, c.data());
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      const framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.deleteFramebuffer(framebuffer);
      gl.deleteTexture(texture);
      if (ok) {
        if (c.label !== 'RGBA16F') {
          console.warn('[omp] 当前环境不支持 RGBA16F 渲染目标，已回退到', c.label);
        }
        return c;
      }
    }
    throw new Error('当前环境不支持浮点渲染目标（RGBA16F / RGBA32F 均不可渲染），WebGL2 GPGPU 无法运行');
  }

  createRenderTarget() {
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const zero = this.rtFormat.type === gl.HALF_FLOAT
      ? new Uint16Array(SIM_SIZE * SIM_SIZE * 4)
      : new Float32Array(SIM_SIZE * SIM_SIZE * 4);
    gl.texImage2D(gl.TEXTURE_2D, 0, this.rtFormat.internal, SIM_SIZE, SIM_SIZE, 0, gl.RGBA, this.rtFormat.type, zero);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error('渲染目标帧缓冲不完整（' + this.rtFormat.label + '）');
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { texture, framebuffer };
  }

  // ---- 渲染 pass（对应源码 setupRenderMaterial） ----
  initRender() {
    const gl = this.gl;

    this.renderProgram = createProgram(gl, RENDER_VS, RENDER_FS);

    // 顶点数据：uv = 粒子索引 → 纹理坐标；seeds = 每粒子 4 个随机数
    const uv = new Float32Array(this.count * 2);
    const seeds = new Float32Array(this.count * 4);
    for (let i = 0; i < this.count; i++) {
      const col = i % SIM_SIZE;
      const row = Math.floor(i / SIM_SIZE);
      uv[i * 2] = col / SIM_SIZE;
      uv[i * 2 + 1] = row / SIM_SIZE;
    }
    for (let i = 0; i < this.count; i++) {
      seeds[i * 4 + 0] = Math.random();
      seeds[i * 4 + 1] = Math.random();
      seeds[i * 4 + 2] = Math.random();
      seeds[i * 4 + 3] = Math.random();
    }

    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
    const uvLoc = gl.getAttribLocation(this.renderProgram, 'uv');
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

    const seedBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, seedBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
    const seedLoc = gl.getAttribLocation(this.renderProgram, 'seeds');
    gl.enableVertexAttribArray(seedLoc);
    gl.vertexAttribPointer(seedLoc, 4, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);

    this.renderUniforms = {};
    for (const name of ['uPosition', 'uParticleScale', 'uPixelRatio', 'uModelViewMatrix', 'uProjectionMatrix', 'uColor1', 'uColor2', 'uColor3', 'uRingPos', 'uRez', 'uAlpha', 'uTime', 'uColorScheme']) {
      this.renderUniforms[name] = gl.getUniformLocation(this.renderProgram, name);
    }
    this.colorVec = this.colors.map(hexToRgb);

    // 渲染材质：transparent + 默认 NormalBlending（源码未显式设置 blending）
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  setTheme(theme, palette = {}) {
    this.theme = theme === 'dark' ? 'dark' : 'light';
    this.colorScheme = this.theme === 'dark' ? 0 : 1;
    this.colors = palette.colors || (this.theme === 'dark'
      ? ['#7189ff', '#3074f9', '#000000']
      : ['#2c64ed', '#f84242', '#ffcf03']);
    this.background = palette.background || (this.theme === 'dark' ? [0, 0, 0] : [1, 1, 1]);
    this.colorVec = this.colors.map(hexToRgb);
  }

  // ---- 每帧：物理 + uniform 更新 + 模拟 pass（对应源码 M.update） ----
  update() {
    const gl = this.gl;

    // 漂移噪声（对应源码 this.noise.getVal，one-arg 1D 值噪声）
    const tWander = (this.noise.getVal(this.time * 0.66 + 94.234) - 0.5) * 2;
    const nWander = (this.noise.getVal(this.time * 0.75 + 21.028) - 0.5) * 2;

    this.cursorPos.x = tWander * 0.2;
    this.cursorPos.y = nWander * 0.1;
    if (this.isIntersecting) {
      this.cursorPos.x = this.intersectionPoint[0] * 0.175 + tWander * 0.1;
      this.cursorPos.y = this.intersectionPoint[1] * 0.175 + nWander * 0.1;
      this.ringPos.x += (this.cursorPos.x - this.ringPos.x) * 0.02;
      this.ringPos.y += (this.cursorPos.y - this.ringPos.y) * 0.02;
    } else {
      this.ringPos.x += (this.cursorPos.x - this.ringPos.x) * 0.01;
      this.ringPos.y += (this.cursorPos.y - this.ringPos.y) * 0.01;
    }

    this.particleScale = (this.canvas.width / this.pixelRatio / 2000) * this.particlesScale;

    // ---- 模拟 pass：读 rt[0]，写 rt[1] ----
    const u = this.simUniforms;
    gl.useProgram(this.simProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.everRendered ? this.rt[0].texture : this.posTex);
    gl.uniform1i(u.uPosition, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.posTex);
    gl.uniform1i(u.uPosRefs, 1);
    gl.uniform1f(u.uTime, this.time);
    gl.uniform1f(u.uDeltaTime, this.dt);
    gl.uniform1f(u.uRingRadius, 0.175 + Math.sin(this.time * 1) * 0.03 + Math.cos(this.time * 3) * 0.02);
    gl.uniform2f(u.uRingPos, this.ringPos.x, this.ringPos.y);
    gl.uniform1f(u.uRingWidth, this.ringWidth);
    gl.uniform1f(u.uRingWidth2, this.ringWidth2);
    gl.uniform1f(u.uRingDisplacement, this.ringDisplacement);
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.rt[1].framebuffer);
    gl.viewport(0, 0, SIM_SIZE, SIM_SIZE);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    // ---- 渲染 pass uniforms ----
    const r = this.renderUniforms;
    gl.useProgram(this.renderProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.everRendered ? this.rt[1].texture : this.posTex);
    gl.uniform1i(r.uPosition, 0);
    gl.uniform1f(r.uParticleScale, this.particleScale);
    gl.uniform1f(r.uPixelRatio, this.pixelRatio);
    gl.uniformMatrix4fv(r.uModelViewMatrix, false, this.modelView);
    gl.uniformMatrix4fv(r.uProjectionMatrix, false, this.projection);
    gl.uniform3fv(r.uColor1, this.colorVec[0]);
    gl.uniform3fv(r.uColor2, this.colorVec[1]);
    gl.uniform3fv(r.uColor3, this.colorVec[2]);
    gl.uniform2f(r.uRingPos, this.ringPos.x, this.ringPos.y);
    gl.uniform2f(r.uRez, this.canvas.width, this.canvas.height);
    gl.uniform1f(r.uAlpha, 1);
    gl.uniform1f(r.uTime, this.time);
    gl.uniform1i(r.uColorScheme, this.colorScheme);
  }

  // ---- 鼠标 NDC + 射线与 z=0 平面求交（对应源码 preRender 的 raycaster） ----
  updateMouse() {
    if (!this.interactive) return;
    const rect = this.canvas.getBoundingClientRect();
    // 源码：先按 screenWidth/Height 归一化，再转 NDC
    let mx = (sharedCursor.x - rect.left) * (window.innerWidth / rect.width);
    let my = (sharedCursor.y - rect.top) * (window.innerHeight / rect.height);
    mx = (mx / window.innerWidth) * 2 - 1;
    my = -((my / window.innerHeight) * 2) + 1;
    if (mx < -1 || mx > 1 || my < -1 || my > 1) {
      this.isIntersecting = false;
      return;
    }
    // 射线与 raycastPlane（12.5×12.5，z=0）求交：相机 fov40 / z=3.1
    const tanHalf = Math.tan((40 * Math.PI / 180) / 2);
    const aspect = this.canvas.width / this.canvas.height;
    const ix = mx * tanHalf * aspect * 3.1;
    const iy = my * tanHalf * 3.1;
    this.isIntersecting = Math.abs(ix) <= 6.25 && Math.abs(iy) <= 6.25;
    this.intersectionPoint[0] = ix;
    this.intersectionPoint[1] = iy;
  }

  // ---- 单帧渲染（对应源码 N.render + M.postRender 的 ping-pong 交换） ----
  render() {
    if (this.isPaused) return;
    const gl = this.gl;

    // preRender：dt / time 累积
    const now = performance.now();
    this.dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    this.time += this.dt;

    this.update();
    this.updateMouse();

    // 清屏（背景色）+ 绘制粒子
    gl.clearColor(this.background[0], this.background[1], this.background[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.POINTS, 0, this.count);
    gl.bindVertexArray(null);

    // postRender：交换 rt[0]/rt[1]
    const tmp = this.rt[0];
    this.rt[0] = this.rt[1];
    this.rt[1] = tmp;
    this.everRendered = true;
  }

  stop() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
    // 对应源码 clock.stop()/start()：恢复后 elapsedTime ≈ 0
    this.time = 0;
    this.lastTime = performance.now();
  }

  kill() {
    const gl = this.gl;
    window.removeEventListener('resize', this.onResize);
    gl.deleteTexture(this.posTex);
    for (const rt of this.rt) {
      gl.deleteFramebuffer(rt.framebuffer);
      gl.deleteTexture(rt.texture);
    }
    gl.deleteProgram(this.simProgram);
    gl.deleteProgram(this.renderProgram);
    gl.deleteVertexArray(this.vao);
    if (this.canvas.parentElement) this.canvas.parentElement.removeChild(this.canvas);
  }
}

// ---------------------------------------------------------------------------
// 自举：与源码 DOMContentLoaded 逻辑一致（data-main-particles-component 属性驱动）
// ---------------------------------------------------------------------------
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-main-particles-component]').forEach((el) => {
      const container = el.querySelector('[data-container]');
      if (!container) return;
      try {
        const readPalette = (theme) => {
          const suffix = theme === 'dark' ? '-dark' : '';
          const colors = [
            el.getAttribute(`data-particle-color-1${suffix}`),
            el.getAttribute(`data-particle-color-2${suffix}`),
            el.getAttribute(`data-particle-color-3${suffix}`),
          ];
          const backgroundHex = el.getAttribute(`data-particle-background${suffix}`);
          return {
            colors: colors.every(Boolean) ? colors : undefined,
            background: backgroundHex ? hexToRgb(backgroundHex) : undefined,
          };
        };
        const theme = document.documentElement.dataset.theme || el.getAttribute('data-theme') || 'light';
        const ringWidth = parseFloat(el.getAttribute('data-ring-width') || '0.15');
        const ringWidth2 = parseFloat(el.getAttribute('data-ring-width2') || '0.05');
        const ringDisplacement = parseFloat(el.getAttribute('data-ring-displacement') || '0.15');
        const density = parseInt(el.getAttribute('data-density') || '200', 10);
        const palette = readPalette(theme);
        const inst = new AntigravityParticles({
          container,
          theme,
          particlesScale: parseFloat(el.getAttribute('data-particles-scale') || '0.75'),
          density,
          interactive: true,
          ringWidth,
          ringWidth2,
          ringDisplacement,
          colors: palette.colors,
          background: palette.background,
        });
        const onThemeChange = (event) => {
          const nextTheme = event.detail?.theme || document.documentElement.dataset.theme || 'light';
          inst.setTheme(nextTheme, readPalette(nextTheme));
        };
        document.addEventListener('site-theme-change', onThemeChange);
        let intersecting = false;
        let rafId = null;
        const io = new IntersectionObserver((entries) => {
          entries.forEach((en) => {
            intersecting = en.isIntersecting;
            if (en.isIntersecting) inst.resume();
            else inst.stop();
          });
        }, { root: null, rootMargin: '0px', threshold: 0 });
        io.observe(container);
        const loop = () => {
          rafId = requestAnimationFrame(loop);
          if (intersecting) inst.render();
        };
        loop();
        window.addEventListener('beforeunload', () => {
          io.disconnect();
          document.removeEventListener('site-theme-change', onThemeChange);
          if (rafId !== null) cancelAnimationFrame(rafId);
          inst.kill();
        });
      } catch (err) {
        // 初始化失败时在页面上直接显示原因（WebGL2 不可用 / shader 编译错误等）
        const msg = document.createElement('div');
        msg.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;'
          + 'color:#d93025;font:14px/1.6 monospace;padding:24px;text-align:center;z-index:5;white-space:pre-wrap';
        msg.textContent = '粒子组件初始化失败：' + ((err && err.message) || err);
        el.appendChild(msg);
        console.error(err);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// 导出：浏览器挂到 window，Node 走 module.exports（供无头自检）
// 注意：刻意不用 ES module —— file:// 双击打开时浏览器会拦截 module 脚本
// ---------------------------------------------------------------------------
if (typeof window !== 'undefined') {
  window.AntigravityParticles = AntigravityParticles;
  window.ValueNoise1D = ValueNoise1D;
  window.mapRange = mapRange;
  window.poissonDisk = poissonDisk;
  window.hexToRgb = hexToRgb;
  window.SIM_SIZE = SIM_SIZE;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AntigravityParticles, ValueNoise1D, mapRange, poissonDisk, hexToRgb, SIM_SIZE };
}
