#version 120

uniform mat4 modelToCameraMatrix;
uniform mat4 cameraToClipMatrix;
uniform mat4 modelToWorldMatrix;
uniform mat4 modelToClipMatrix;

uniform int active_lights_n; // Number of active lights (< MG_MAX_LIGHT)
uniform vec3 scene_ambient;  // rgb

uniform struct light_t {
	vec4 position;    // Camera space
	vec3 diffuse;     // rgb
	vec3 specular;    // rgb
	vec3 attenuation; // (constant, lineal, quadratic)
	vec3 spotDir;     // Camera space
	float cosCutOff;  // cutOff cosine
	float exponent;
} theLights[4];     // MG_MAX_LIGHTS

uniform struct material_t {
	vec3  diffuse;
	vec3  specular;
	float alpha;
	float shininess;
} theMaterial;

attribute vec3 v_position; // Model space
attribute vec3 v_normal;   // Model space
attribute vec2 v_texCoord;

varying vec4 f_color;
varying vec2 f_texCoord;

float lambert_factor(vec3 n, vec3 l){ //normalized vecs
	return max(0.0, dot(n, l));
}

void main() {
	vec3 positionEye, normalEye, L, diffuse_color;
	positionEye = normalize(modelToCameraMatrix * vec4(v_position, 1)).xyz;
	normalEye = normalize(modelToCameraMatrix * vec4(v_normal, 0)).xyz;
	diffuse_color = vec3(0.0, 0.0, 0.0);

	for (int i = 0; i < active_lights_n; i++){
		if (theLights[i].position[3] == 0) { //Directional light
			L = normalize(-theLights[i].position.xyz);
			diffuse_color += lambert_factor(normalEye, L) * theLights[i].diffuse * theMaterial.diffuse;
		}
	}

	f_color.rgb = scene_ambient + diffuse_color;
	f_color.a = 1.0;

	f_texCoord = v_texCoord;
	gl_Position = modelToClipMatrix * vec4(v_position, 1);
}
