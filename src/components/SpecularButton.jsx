import { useEffect, useRef } from "react";
import { Color, Mesh, Program, Renderer, Triangle } from "ogl";
import "./SpecularButton.css";

const PAD = 20;

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform vec2 uCenter;
uniform vec2 uHalfSize;
uniform float uRadius;
uniform float uAngle;
uniform float uPx;
uniform vec3 uLineColor;
uniform vec3 uBaseColor;
uniform float uIntensity;
uniform float uShineSize;
uniform float uShineFade;
uniform float uThickness;
uniform float uBaseWidth;

out vec4 fragColor;

float sdRoundedRect(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float shapeSDF(vec2 p) {
  return sdRoundedRect(p, uHalfSize, uRadius);
}

float gaussianLine(float d, float sigma) {
  float x = d / (sigma + 1e-6);
  float k = mix(1.0, 1.6, smoothstep(0.0, 1.5, x));
  return exp(-k * x * x);
}

void main() {
  vec2 p = gl_FragCoord.xy - uCenter;
  float d = shapeSDF(p);
  vec2 lightDirection = vec2(cos(uAngle), sin(uAngle));

  float base = (1.0 - smoothstep(0.0, uBaseWidth, abs(d))) * 0.45;
  vec2 ellipseNormal = normalize(p / (uHalfSize * uHalfSize) + 1e-6);
  float angleToLight = acos(clamp(abs(dot(ellipseNormal, lightDirection)), 0.0, 1.0));
  float rim = 1.0 - smoothstep(
    uShineSize - uShineFade,
    uShineSize + uShineFade + 1e-4,
    angleToLight
  );
  float line = gaussianLine(d, uThickness);
  float edgeClamp = 1.0 - smoothstep(0.5 * uPx, 3.0 * uPx, abs(d));
  float highlight = line * rim * edgeClamp * uIntensity;

  vec3 color = uBaseColor * base + uLineColor * highlight;
  float alpha = clamp(base + highlight, 0.0, 1.0);
  fragColor = vec4(color, alpha);
}
`;

function SpecularButton({
  children,
  className = "",
  radius = 14,
  lineColor = "#c9fff0",
  baseColor = "#177e72",
  intensity = 0.82,
  shineSize = 10,
  shineFade = 40,
  thickness = 1,
  speed = 0.35,
  followMouse = true,
  proximity = 250,
  autoAnimate = false,
  ...buttonProps
}) {
  const buttonRef = useRef(null);
  const effectRef = useRef(null);
  const propsRef = useRef({});

  useEffect(() => {
    propsRef.current = {
      radius,
      lineColor,
      baseColor,
      intensity,
      shineSize,
      shineFade,
      thickness,
      speed,
      followMouse,
      proximity,
      autoAnimate,
    };
  }, [
    radius,
    lineColor,
    baseColor,
    intensity,
    shineSize,
    shineFade,
    thickness,
    speed,
    followMouse,
    proximity,
    autoAnimate,
  ]);

  useEffect(() => {
    const button = buttonRef.current;
    const effect = effectRef.current;
    if (!button || !effect) return undefined;

    const dpr = window.devicePixelRatio || 1;
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
    });
    if (!gl) return undefined;

    const renderer = new Renderer({
      canvas,
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
      dpr,
    });
    renderer.gl.clearColor(0, 0, 0, 0);
    renderer.gl.enable(renderer.gl.BLEND);
    renderer.gl.blendFunc(renderer.gl.ONE, renderer.gl.ONE_MINUS_SRC_ALPHA);

    const geometry = new Triangle(renderer.gl);
    if (geometry.attributes.uv) delete geometry.attributes.uv;

    const program = new Program(renderer.gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uCenter: { value: [0, 0] },
        uHalfSize: { value: [1, 1] },
        uRadius: { value: 0 },
        uAngle: { value: 2.4 },
        uPx: { value: dpr },
        uLineColor: { value: [1, 1, 1] },
        uBaseColor: { value: [0.32, 0.32, 0.32] },
        uIntensity: { value: 1 },
        uShineSize: { value: 0.17 },
        uShineFade: { value: 0.7 },
        uThickness: { value: 1 },
        uBaseWidth: { value: dpr },
      },
    });
    const mesh = new Mesh(renderer.gl, { geometry, program });
    effect.appendChild(canvas);

    const size = { width: 1, height: 1 };
    const resize = () => {
      const rect = button.getBoundingClientRect();
      size.width = rect.width;
      size.height = rect.height;
      renderer.setSize(rect.width + PAD * 2, rect.height + PAD * 2);
      program.uniforms.uCenter.value = [
        (PAD + rect.width / 2) * dpr,
        (PAD + rect.height / 2) * dpr,
      ];
      program.uniforms.uHalfSize.value = [
        (rect.width / 2) * dpr,
        (rect.height / 2) * dpr,
      ];
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(button);
    resize();

    let pointerAngle = null;
    let proximityAmount = 0;
    const onPointerMove = (event) => {
      const rect = button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = Math.max(rect.left - event.clientX, 0, event.clientX - rect.right);
      const dy = Math.max(rect.top - event.clientY, 0, event.clientY - rect.bottom);
      const distance = Math.hypot(dx, dy);

      if (distance === 0) {
        const nx = (event.clientX - centerX) / (rect.width / 2);
        const ny = (centerY - event.clientY) / (rect.height / 2);
        pointerAngle = Math.atan2(2 / rect.height, -2 / rect.width) + nx * 0.3 + ny * 0.15;
      } else {
        pointerAngle = Math.atan2(centerY - event.clientY, event.clientX - centerX);
      }

      const proximity = Math.max(0, 1 - distance / Math.max(propsRef.current.proximity, 1));
      proximityAmount = proximity * proximity * (3 - 2 * proximity);
    };
    window.addEventListener("pointermove", onPointerMove);

    let angle = 2.4;
    let idleAngle = 2.4;
    let brightness = 0;
    let last = performance.now();
    let animationFrame = 0;
    const line = new Color();
    const base = new Color();

    const update = (now) => {
      animationFrame = requestAnimationFrame(update);
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      const currentProps = propsRef.current;

      idleAngle += currentProps.speed * delta;
      const shouldFollowPointer =
        currentProps.followMouse &&
        pointerAngle !== null &&
        (!currentProps.autoAnimate || proximityAmount > 0);
      const targetAngle = shouldFollowPointer ? pointerAngle : idleAngle;
      const angleDifference = ((targetAngle - angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      angle += angleDifference * (1 - Math.exp(-delta * 7));

      const targetBrightness = currentProps.autoAnimate ? 1 : proximityAmount;
      brightness += (targetBrightness - brightness) * (1 - Math.exp(-delta * 8));

      line.set(currentProps.lineColor);
      base.set(currentProps.baseColor);
      program.uniforms.uAngle.value = angle;
      program.uniforms.uRadius.value =
        Math.min(currentProps.radius, Math.min(size.width, size.height) / 2) * dpr;
      program.uniforms.uLineColor.value = [line.r, line.g, line.b];
      program.uniforms.uBaseColor.value = [base.r, base.g, base.b];
      program.uniforms.uIntensity.value = currentProps.intensity * brightness;
      program.uniforms.uShineSize.value = (currentProps.shineSize * Math.PI) / 180;
      program.uniforms.uShineFade.value = (currentProps.shineFade * Math.PI) / 180;
      program.uniforms.uThickness.value = currentProps.thickness * dpr;
      renderer.render({ scene: mesh });
    };
    animationFrame = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      if (canvas.parentNode === effect) effect.removeChild(canvas);
      renderer.gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <button
      {...buttonProps}
      ref={buttonRef}
      className={`specular-button${className ? ` ${className}` : ""}`}
    >
      <span ref={effectRef} className="specular-button__fx" aria-hidden="true" />
      <span className="specular-button__label">{children}</span>
    </button>
  );
}

export default SpecularButton;
