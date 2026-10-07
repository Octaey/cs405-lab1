// CS405 · Lab 1 — your first triangle in WebGPU (starter)
// Work through the TODOs in order. After each one, check the matching
// checkpoint on the lab slides. The reference solution is in ../lab1-solution/.

const canvas = document.querySelector('canvas');

// ---------------------------------------------------------------------------
// TODO 1 — get a device and configure the canvas
//   a) check navigator.gpu exists, throw a clear error if not
//   b) const adapter = await navigator.gpu.requestAdapter()
//   c) const device  = await adapter.requestDevice()
//   d) const ctx     = canvas.getContext('webgpu')
//   e) const format  = navigator.gpu.getPreferredCanvasFormat()
//   f) ctx.configure({ device, format, alphaMode: 'opaque' })
//   g) console.log('WebGPU ready:', format)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// TODO 2 — a shader module and a render pipeline
//   The vertex shader returns clip-space positions for vertex_index 0, 1, 2.
//   The fragment shader returns a solid colour.
//   Then: device.createRenderPipeline({ layout: 'auto', vertex, fragment })
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// TODO 3 — a colour per vertex
//   Return a struct from the vertex shader with @location(0) colour,
//   take it as the fragment shader's input, and watch it interpolate.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// TODO 4 — a uniform buffer with the time, and rotate the triangle
//   size 16 bytes, usage UNIFORM | COPY_DST
//   bind group from pipeline.getBindGroupLayout(0)
//   device.queue.writeBuffer(...) every frame
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// TODO 5 — your turn: a square (two triangles), correct aspect ratio,
//   and the shape following the mouse.
// ---------------------------------------------------------------------------

/*
const t0 = performance.now();

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const r = canvas.getBoundingClientRect();
  canvas.width = Math.round(r.width * dpr);
  canvas.height = Math.round(r.height * dpr);
}
window.addEventListener('resize', resize);
resize();

function frame() {
  // TODO 1 (continued): create a command encoder, begin a render pass that
  // clears the canvas, end it, and submit it to device.queue.
  //
  // TODO 2 (continued): pass.setPipeline(pipeline); pass.draw(3);
  // TODO 4 (continued): writeBuffer + pass.setBindGroup(0, bind);

  requestAnimationFrame(frame);
}
frame();
*/

const canvas = document.querySelector('canvas');
if (!navigator.gpu) throw new Error('WebGPU not available');

const adapter = await navigator.gpu.requestAdapter();
const device  = await adapter.requestDevice();

const ctx = canvas.getContext('webgpu');
const format = navigator.gpu.getPreferredCanvasFormat();
ctx.configure({ device, format, alphaMode: 'opaque' });
console.log('WebGPU ready:', format);

const SHADER =
  struct U {time: f32, aspect: f32, mouse: vec2f};
  @group(0) @binding(0) var<uniform> u: U;

  struct VSOut {
    @builtin(position) pos: vec4f,
    @location(0) colour: vec4f
  };


  @vertex fn vs(@builtin(vertex_index) i: u32)
       -> VSOut {
    var p = array<vec2f, 6>(
      vec2f( -1.0,  -1.0),
      vec2f( 1.0, -1.0),
      vec2f( 1.0, 1.0),
      
      vec2f( -1.0, -1.0),
      vec2f( 1.0, 1.0),
      vec2f( -1.0, 1.0));
    
    var c = array<vec3f, 6>(
      vec3f(1.0, 0.0, 0.0),
      vec3f(0.0, 1.0, 0.0),
      vec3f(0.0, 0.0, 1.0)
      
      vec3f(1.0, 0.0, 0.0),
      vec3f(0.0, 0.0, 1.0),
      vec3f(1.0, 1.0, 0.0));

      let a = u.time;
      let s = p[i] * 0.25;
      var q = vec2f(s.x * cos(a) - s.y * sin(a), s.x * sin(a) - s.y * cos(a));
      q.x = q.x / u.aspect;
      q = q + u.mouse;
      

      var out: VSOut;
      out.pos = vec4f(q, 0.0,1.0);
      out.colour = vec4f(c[i], 1.0);
      return out;
  }
  @fragment fn fs(in: VSOut) -> @location(0) vec4f {
    return in.colour;
  };

const module = device.createShaderModule({ code: SHADER });

const pipeline = device.createRenderPipeline({
  layout: 'auto',
  vertex: { module, entryPoint: 'vs' },
  fragment: { module, entryPoint: 'fs', targets: [{ format }] }
});


const ubuf = device.createBuffer({
  size: 16,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
});

const bind = device.createBindGroup({
  layout: pipeline.getBindGroupLayout(0),
  entries: [{ binding: 0, resource: { buffer: ubuf } }]
});

// ---------------------------------------------------------------------------
// TODO 5 - your turn: a square (two triangles), correct aspect ratio,
//   and the shape following the mouse.
// ---------------------------------------------------------------------------

const t0 = performance.now();

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const r = canvas.getBoundingClientRect();
  canvas.width = Math.round(r.width * dpr);
  canvas.height = Math.round(r.height * dpr);
}
window.addEventListener('resize', resize);
resize();

let mouse = [0, 0];
  const r = canvas.getBoundingClientRect();
  canvas.addEventListener('pointermove', (e) => {
  mouse = [
    ((e.clientX - r.left) / r.width) * 2 - 1,
    1 - ((e.clientY - r.top) / r.height) * 2
  ];
});

function frame() {

  const t = (performance.now() - t0) * 0.001;
  const aspect = canvas.width / canvas.height;

  device.queue.writeBuffer(ubuf, 0, new Float32Array([t, aspect, mouse[0], mouse[1]]));

  const enc = device.createCommandEncoder();
  const pass = enc.beginRenderPass({ colorAttachments: [{
    view: ctx.getCurrentTexture().createView(),
    clearValue: { r: 0.19, g: 0.2, b: 0.6, a: 1 },
    loadOp: 'clear', storeOp: 'store' }] });

  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bind);
  pass.draw(6);
  pass.end();

  device.queue.submit([enc.finish()]);

  requestAnimationFrame(frame);
}
frame();




