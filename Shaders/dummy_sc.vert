#version 120

uniform mat4 modelToCameraMatrix; // M
uniform mat4 cameraToClipMatrix;  // P
uniform float sc;

attribute vec3 v_position;

varying vec4 f_color;

void main() {

	vec3 pos = v_position + vec3(0.0, sin(sc), 0.0);
	f_color = vec4(sin(sc),cos(sc),1 - cos(sc),1);
	gl_Position = cameraToClipMatrix * modelToCameraMatrix * vec4(pos, 1);
}
