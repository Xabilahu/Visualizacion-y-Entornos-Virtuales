#version 120

// Bump mapping with many lights.

// all attributes in model space
attribute vec3 v_position;
attribute vec3 v_normal;
attribute vec2 v_texCoord;
// Tanget and Bitangent calculus at triangleMesh::tangentTriangle
attribute vec3 v_TBN_t;
attribute vec3 v_TBN_b;

uniform mat4 modelToCameraMatrix;
uniform mat4 modelToWorldMatrix;
uniform mat4 cameraToClipMatrix;
uniform mat4 modelToClipMatrix;

uniform int active_lights_n; // Number of active lights (< MG_MAX_LIGHT)

uniform struct light_t {
	vec4 position;    // Camera space
	vec3 diffuse;     // rgb
	vec3 specular;    // rgb
	vec3 attenuation; // (constant, lineal, quadratic)
	vec3 spotDir;     // Camera space
	float cosCutOff;  // cutOff cosine
	float exponent;
} theLights[4];     // MG_MAX_LIGHTS

// All bump computations are performed in tangent space; therefore, we need to
// convert all light (and spot) directions and view directions to tangent space
// and pass them the fragment shader.

varying vec2 f_texCoord;
varying vec3 f_viewDirection;     // tangent space
varying vec3 f_lightDirection[4]; // tangent space
varying vec3 f_spotDirection[4];  // tangent space

const float epsilon = 0.0001;

// Code based in:
// - http://fabiensanglard.net/bumpMapping/index.php
// - http://www.opengl-tutorial.org/es/intermediate-tutorials/tutorial-13-normal-mapping/
void main() {
	vec4 t, b, n;
	mat4 cameraToTangentMatrix; // Othonormal matrix -> Inverse = Transpose
	int i; vec3 tangentPosition, tangentLightPosition;

	t = modelToCameraMatrix * vec4(normalize(v_TBN_t), 0.0);
	b = modelToCameraMatrix * vec4(normalize(v_TBN_b), 0.0);
	n = modelToCameraMatrix * vec4(normalize(v_normal), 0.0);
	cameraToTangentMatrix = transpose(mat4(t, b, n, vec4(0.0, 0.0, 0.0, 1.0)));

	tangentPosition = (cameraToTangentMatrix * modelToCameraMatrix * (vec4(v_position, 1.0))).xyz;
	f_viewDirection = -tangentPosition;
	
	for(i = 0; i < active_lights_n; i++) {
		tangentLightPosition = (cameraToTangentMatrix * theLights[i].position).xyz;
		if (theLights[i].position[3] == 0){ // Directional Light
			f_lightDirection[i] = -tangentLightPosition;
		} else { // Positional or Spotlight
			f_lightDirection[i] = tangentLightPosition - tangentPosition;
			if (theLights[i].cosCutOff > epsilon) { // Spotlight
				f_spotDirection[i] = (cameraToTangentMatrix * vec4(theLights[i].spotDir, 0.0)).xyz;
			}
		}
	}

	f_texCoord = v_texCoord;
	gl_Position = modelToClipMatrix * vec4(v_position, 1.0);
}
