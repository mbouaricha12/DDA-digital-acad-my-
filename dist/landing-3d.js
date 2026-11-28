'use strict';

/*
 * DDA Aurora scene — real WebGL geometry, no remote library or market feed.
 * The photograph and product UI remain HTML; this canvas adds the orbiting
 * globe, chart bars, illuminated nodes and perspective depth around them.
 */
(() => {
  const scene = document.querySelector('#landing [data-3d-scene="dda-orbit"]');
  const canvas = scene?.querySelector('[data-landing-3d-canvas]');
  if (!scene || !canvas) return;

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isLowData = () => document.body.classList.contains('low-data');
  const contextOptions = { alpha: true, antialias: true, depth: true, powerPreference: 'low-power', preserveDrawingBuffer: false };
  let gl;
  try { gl = canvas.getContext('webgl', contextOptions) || canvas.getContext('experimental-webgl', contextOptions); }
  catch { gl = null; }
  if (!gl) {
    scene.dataset.sceneState = 'fallback';
    scene.dataset.sceneMode = 'css';
    return;
  }

  const vertexSource = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    uniform mat4 uProjection;
    uniform mat4 uView;
    uniform mat4 uModel;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vec4 world = uModel * vec4(aPosition, 1.0);
      vPosition = world.xyz;
      vNormal = normalize(mat3(uModel) * aNormal);
      gl_Position = uProjection * uView * world;
    }
  `;
  const fragmentSource = `
    precision mediump float;
    uniform vec3 uColor;
    uniform vec3 uLightPosition;
    uniform float uOpacity;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vec3 normal = normalize(vNormal);
      vec3 lightDirection = normalize(uLightPosition - vPosition);
      vec3 viewDirection = normalize(vec3(0.0, 0.0, 5.2) - vPosition);
      float diffuse = max(dot(normal, lightDirection), 0.0);
      float rim = pow(1.0 - max(dot(normal, viewDirection), 0.0), 2.2);
      float specular = pow(max(dot(reflect(-lightDirection, normal), viewDirection), 0.0), 22.0);
      vec3 coolLight = vec3(0.12, 0.48, 1.0) * rim * 0.34;
      vec3 warmLight = vec3(1.0, 0.73, 0.34) * specular * 0.30;
      vec3 color = uColor * (0.25 + diffuse * 0.66) + coolLight + warmLight;
      gl_FragColor = vec4(color, uOpacity * (0.62 + diffuse * 0.38));
    }
  `;

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      throw new Error('DDA WebGL shader compilation failed');
    }
    return shader;
  }

  function makeProgram() {
    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('DDA WebGL program link failed');
    return program;
  }

  function vertex(position, normal) { return [...position, ...normal]; }

  function cubeVertices() {
    const faces = [
      { n: [0, 0, 1], p: [[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]] },
      { n: [0, 0,-1], p: [[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]] },
      { n: [1, 0, 0], p: [[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]] },
      { n: [-1,0, 0], p: [[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]] },
      { n: [0, 1, 0], p: [[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]] },
      { n: [0,-1, 0], p: [[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]] }
    ];
    const out = [];
    for (const face of faces) {
      const [a, b, c, d] = face.p;
      for (const point of [a,b,c,a,c,d]) out.push(...vertex(point, face.n));
    }
    return out;
  }

  function sphereVertices(rows = 20, columns = 28) {
    const out = [];
    for (let row = 0; row < rows; row++) {
      const v0 = row / rows, v1 = (row + 1) / rows;
      const t0 = v0 * Math.PI, t1 = v1 * Math.PI;
      for (let col = 0; col < columns; col++) {
        const u0 = col / columns, u1 = (col + 1) / columns;
        const p = (u, t) => [Math.sin(t) * Math.cos(u * Math.PI * 2), Math.cos(t), Math.sin(t) * Math.sin(u * Math.PI * 2)];
        const a = p(u0, t0), b = p(u1, t0), c = p(u1, t1), d = p(u0, t1);
        for (const point of [a,b,c,a,c,d]) out.push(...vertex(point, point));
      }
    }
    return out;
  }

  function torusVertices(radius = 1.2, tube = 0.028, around = 84, sides = 9) {
    const out = [];
    const point = (u, v) => {
      const cu = Math.cos(u), su = Math.sin(u), cv = Math.cos(v), sv = Math.sin(v);
      return { position: [(radius + tube * cv) * cu, (radius + tube * cv) * su, tube * sv], normal: [cv * cu, cv * su, sv] };
    };
    for (let i = 0; i < around; i++) {
      const u0 = i / around * Math.PI * 2, u1 = (i + 1) / around * Math.PI * 2;
      for (let j = 0; j < sides; j++) {
        const v0 = j / sides * Math.PI * 2, v1 = (j + 1) / sides * Math.PI * 2;
        const a = point(u0, v0), b = point(u1, v0), c = point(u1, v1), d = point(u0, v1);
        for (const p of [a,b,c,a,c,d]) out.push(...vertex(p.position, p.normal));
      }
    }
    return out;
  }

  function makeMesh(values) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);
    return { buffer, count: values.length / 6 };
  }

  function identity() { return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); }
  function multiply(a, b) {
    const out = new Float32Array(16);
    for (let col = 0; col < 4; col++) for (let row = 0; row < 4; row++) {
      out[col * 4 + row] = a[row] * b[col * 4] + a[4 + row] * b[col * 4 + 1] + a[8 + row] * b[col * 4 + 2] + a[12 + row] * b[col * 4 + 3];
    }
    return out;
  }
  function translation(x, y, z) { const m = identity(); m[12] = x; m[13] = y; m[14] = z; return m; }
  function scaling(x, y, z) { const m = identity(); m[0] = x; m[5] = y; m[10] = z; return m; }
  function rotateX(a) { const c=Math.cos(a),s=Math.sin(a);return new Float32Array([1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]); }
  function rotateY(a) { const c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]); }
  function rotateZ(a) { const c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]); }
  function model(x, y, z, rx, ry, rz, sx, sy, sz) {
    let m = translation(x, y, z);
    m = multiply(m, rotateY(ry)); m = multiply(m, rotateX(rx)); m = multiply(m, rotateZ(rz));
    return multiply(m, scaling(sx, sy, sz));
  }
  function perspective(fov, aspect, near, far) {
    const f = 1 / Math.tan(fov / 2), nf = 1 / (near - far), out = new Float32Array(16);
    out[0] = f / aspect; out[5] = f; out[10] = (far + near) * nf; out[11] = -1;
    out[14] = 2 * far * near * nf; return out;
  }

  let program, meshes;
  try {
    program = makeProgram();
    gl.useProgram(program);
    const attributes = { position: gl.getAttribLocation(program, 'aPosition'), normal: gl.getAttribLocation(program, 'aNormal') };
    const uniforms = {
      projection: gl.getUniformLocation(program, 'uProjection'), view: gl.getUniformLocation(program, 'uView'),
      model: gl.getUniformLocation(program, 'uModel'), color: gl.getUniformLocation(program, 'uColor'),
      opacity: gl.getUniformLocation(program, 'uOpacity'), light: gl.getUniformLocation(program, 'uLightPosition')
    };
    meshes = {
      cube: makeMesh(cubeVertices()), sphere: makeMesh(sphereVertices()),
      goldOrbit: makeMesh(torusVertices(1.17, .026)), blueOrbit: makeMesh(torusVertices(1.43, .016)),
      violetOrbit: makeMesh(torusVertices(.96, .012, 72, 8))
    };

    const view = translation(0, 0, -5.2);
    const colors = {
      gold: new Float32Array([.88, .63, .24]), blue: new Float32Array([.10, .44, .90]),
      violet: new Float32Array([.42, .34, .92]), core: new Float32Array([.055, .22, .40])
    };
    const resize = () => {
      const rect = scene.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(rect.width * pixelRatio));
      const height = Math.max(1, Math.round(rect.height * pixelRatio));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; gl.viewport(0, 0, width, height); }
      return true;
    };
    function draw(mesh, matrix, color, opacity) {
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);
      gl.enableVertexAttribArray(attributes.position); gl.vertexAttribPointer(attributes.position, 3, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(attributes.normal); gl.vertexAttribPointer(attributes.normal, 3, gl.FLOAT, false, 24, 12);
      gl.uniformMatrix4fv(uniforms.model, false, matrix);
      gl.uniform3fv(uniforms.color, color); gl.uniform1f(uniforms.opacity, opacity);
      gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
    }
    function render(time) {
      if (!resize()) return;
      const aspect = canvas.width / canvas.height;
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(program);
      gl.uniformMatrix4fv(uniforms.projection, false, perspective(43 * Math.PI / 180, aspect, .1, 40));
      gl.uniformMatrix4fv(uniforms.view, false, view);
      gl.uniform3f(uniforms.light, -2.0, 3.2, 4.0);
      const turn = time * .00012;
      const barHeights = [.34,.50,.43,.67,.57,.84,.73,1.05,.88,.96,.71];
      for (let i = 0; i < barHeights.length; i++) {
        const h = barHeights[i], x = (i - 5) * .205;
        draw(meshes.cube, model(x, -.98 + h / 2, -.58, 0, 0, 0, .055, h / 2, .038), i === 7 || i === 3 ? colors.gold : colors.blue, .64);
      }
      draw(meshes.goldOrbit, model(0, 0, 0, .88, turn, .10, 1, 1, 1), colors.gold, .92);
      draw(meshes.blueOrbit, model(0, 0, 0, -.50, -.35 + turn * .72, .08, 1, 1, 1), colors.blue, .82);
      draw(meshes.violetOrbit, model(0, 0, 0, 1.22, .38 - turn * .48, -.16, 1, 1, 1), colors.violet, .48);
      draw(meshes.sphere, model(0, 0, .02, .08, turn * .5, 0, .43, .43, .43), colors.core, .94);
      const nodes = [
        { x: 1.12, y: .82, z: .10, c: colors.gold }, { x: -.95, y: -.52, z: .15, c: colors.blue },
        { x: -.30, y: 1.30, z: -.10, c: colors.violet }, { x: .72, y: -1.08, z: .08, c: colors.gold }
      ];
      for (const node of nodes) draw(meshes.sphere, model(node.x, node.y, node.z, 0, turn, 0, .075, .075, .075), node.c, .96);
    }

    scene.dataset.sceneState = 'webgl';
    scene.dataset.sceneMode = 'animated';
    const reduced = () => motionPreference.matches;
    let frame = 0, lastFrameAt = 0, frameCount = 0, pointerTilt = 0;
    let inViewport = !('IntersectionObserver' in window), contextLost = false;
    const staticMode = () => reduced() || isLowData();
    const drawStatic = () => {
      cancelAnimationFrame(frame); frame = 0;
      if (contextLost) { scene.dataset.sceneState = 'fallback'; scene.dataset.sceneMode = 'css'; return; }
      render(0);
      scene.dataset.sceneMode = isLowData() ? 'static-low-data' : 'static-reduced-motion';
      scene.dataset.sceneFrames = String(++frameCount);
    };
    const animate = now => {
      frame = 0;
      if (contextLost || document.hidden || !inViewport) {
        scene.dataset.sceneMode = contextLost ? 'css' : document.hidden ? 'paused-hidden' : 'paused-offscreen';
        return;
      }
      if (staticMode()) { drawStatic(); return; }
      if (now - lastFrameAt >= 1000 / 30) {
        lastFrameAt = now; render(now + pointerTilt); frameCount++;
        if (frameCount % 8 === 0) scene.dataset.sceneFrames = String(frameCount);
      }
      frame = requestAnimationFrame(animate);
    };
    const start = () => {
      if (contextLost) { scene.dataset.sceneState = 'fallback'; scene.dataset.sceneMode = 'css'; return; }
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; scene.dataset.sceneMode = 'paused-hidden'; return; }
      if (!inViewport) { cancelAnimationFrame(frame); frame = 0; scene.dataset.sceneMode = 'paused-offscreen'; return; }
      if (staticMode()) { drawStatic(); return; }
      if (!frame) frame = requestAnimationFrame(animate);
      scene.dataset.sceneMode = 'animated';
    };
    const visibilityObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      inViewport = entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= .05);
      if (inViewport) start();
      else { cancelAnimationFrame(frame); frame = 0; scene.dataset.sceneMode = 'paused-offscreen'; }
    }, { threshold: [.05] }) : null;
    visibilityObserver?.observe(scene);
    const resizeObserver = new ResizeObserver(() => { if (inViewport && !document.hidden && staticMode()) drawStatic(); });
    resizeObserver.observe(scene);
    scene.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || staticMode()) return;
      const bounds = scene.getBoundingClientRect();
      pointerTilt = ((event.clientX - bounds.left) / Math.max(1, bounds.width) - .5) * 300;
    }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; scene.dataset.sceneMode = 'paused-hidden'; }
      else start();
    });
    const bodyObserver = new MutationObserver(start);
    bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    const onMotionChange = () => start();
    if (motionPreference.addEventListener) motionPreference.addEventListener('change', onMotionChange);
    else if (motionPreference.addListener) motionPreference.addListener(onMotionChange);
    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault(); contextLost = true; cancelAnimationFrame(frame); frame = 0;
      scene.dataset.sceneState = 'fallback'; scene.dataset.sceneMode = 'css';
    }, { passive: false });
    window.addEventListener('pagehide', () => {
      cancelAnimationFrame(frame); resizeObserver.disconnect(); visibilityObserver?.disconnect(); bodyObserver.disconnect();
    }, { once: true });
    start();
  } catch {
    scene.dataset.sceneState = 'fallback';
    scene.dataset.sceneMode = 'css';
  }
})();
