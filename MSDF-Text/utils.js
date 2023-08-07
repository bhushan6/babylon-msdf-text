import * as BABYLON from "@babylonjs/core";

export const setCustomAttributes = ({ engine, data, kind, stride, mesh }) => {
  const buffer = new BABYLON.VertexBuffer(
    engine,
    data,
    kind,
    true,
    false,
    stride
  );

  mesh.setVerticesBuffer(buffer);
};

export const vertexShader = `
precision highp float; 
// Attributes 
attribute vec3 position; 
attribute vec2 uv; 
attribute vec2 center; 
// Uniforms 
uniform mat4 worldViewProjection; 
// Varying 
varying vec2 vUV; 
varying vec2 vCenter; 
void main(void) { 
  gl_Position = worldViewProjection * vec4(position, 1.0); 
  vUV = uv; 
  vCenter = center;
}
`;
export const fragmentShader = `
precision highp float; 
varying vec2 vUV; 
varying vec2 vCenter; 
uniform sampler2D uFontAtlas; 

float median(float r, float g, float b) {
  return max(min(r, g), min(max(r, g), b));
}

void main(void) { 
  float uThreshold = 0.05;
  float uStrokeOutsetWidth = 0.1;
  float uStrokeInsetWidth = 0.1;
  float  uOpacity =  1.0;
  vec3 uColor = vec3(0.);
  float uAlphaTest =  0.01;
  vec3 uStrokeColor = vec3(1., 0., 0.);

  vec3 s = texture2D(uFontAtlas, vUV).rgb;
  float sigDist = median(s.r, s.g, s.b) - 0.5;
  float afwidth = 1.4142135623730951 / 2.0;
  
  #ifdef IS_SMALL
  float alpha = smoothstep(uThreshold - afwidth, uThreshold + afwidth, sigDist);
  #else
  float alpha = clamp(sigDist / fwidth(sigDist) + 0.5, 0.0, 1.0);
  #endif
  
  float sigDistOutset = sigDist + uStrokeOutsetWidth * 0.5;
  
  // Inset
  float sigDistInset = sigDist - uStrokeInsetWidth * 0.5;
  
  #ifdef IS_SMALL
  float outset = smoothstep(uThreshold - afwidth, uThreshold + afwidth, sigDistOutset);
  float inset = 1.0 - smoothstep(uThreshold - afwidth, uThreshold + afwidth, sigDistInset);
  #else
  float outset = clamp(sigDistOutset / fwidth(sigDistOutset) + 0.5, 0.0, 1.0);
  float inset = 1.0 - clamp(sigDistInset / fwidth(sigDistInset) + 0.5, 0.0, 1.0);
  #endif
  
  float border = outset * inset;
  
  // Alpha Test
  if (alpha < uAlphaTest) discard;

  // Output: Common
  vec4 filledFragColor = vec4(uColor, uOpacity * alpha);
  
  // Output: Strokes
  vec4 strokedFragColor = vec4(uStrokeColor, uOpacity * border);
  
  gl_FragColor = filledFragColor ; 
}
`;
