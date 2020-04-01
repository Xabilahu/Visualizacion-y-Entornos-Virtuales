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

const float epsilon = 0.0001;

float lambert_factor(vec3 n, vec3 l){ //normalized vecs
	return max(0.0, dot(n, l));
}

float specular_factor(vec3 n, vec3 l, vec3 v, float m){
	vec3 r = 2 * dot(n, l) * n - l;
	float dotP = dot(r, v);
	if (dotP > 0)
		return max(0.0, pow(dotP, m));
	else
		return 0.0;
}

float attenuation_factor(int index, float d){
	return 1 / (theLights[index].attenuation[0] + theLights[index].attenuation[1] * d + theLights[index].attenuation[2] * d * d);
}

void main() {
	vec3 positionEye, normalEye, L, diffuse_color, specular_color, v;
	float d, diffuse_factor, att;
	positionEye = (modelToCameraMatrix * vec4(v_position, 1)).xyz; //Camera space
	normalEye = normalize((modelToCameraMatrix * vec4(v_normal, 0)).xyz); //Camera space
	diffuse_color = vec3(0.0);
	specular_color = vec3(0.0);
	v = normalize(-positionEye);

	for (int i = 0; i < active_lights_n; i++){
		if (theLights[i].position[3] == 0) { //Directional light
			L = normalize(-theLights[i].position.xyz);
			diffuse_factor = lambert_factor(normalEye, L);
			diffuse_color += diffuse_factor * theLights[i].diffuse;
			specular_color += specular_factor(normalEye, L, v, theMaterial.shininess) * theLights[i].specular * diffuse_factor;
		} else if (theLights[i].cosCutOff < epsilon){ //Positional light (spotCutOff = 90 -> cosSpotCutOff = 0)
			d = length(theLights[i].position.xyz - positionEye);
			if (d > epsilon) { //Check denominator to avoid dividing by 0
				L = normalize(theLights[i].position.xyz - positionEye);
				diffuse_factor = lambert_factor(normalEye, L);
				att = attenuation_factor(i, d);
				diffuse_color += diffuse_factor * theLights[i].diffuse * att;
				specular_color += specular_factor(normalEye, L, v, theMaterial.shininess) * theLights[i].specular * diffuse_factor * att;
			}
		} 
	}

	f_color.rgb = scene_ambient + diffuse_color * theMaterial.diffuse + specular_color * theMaterial.specular;
	f_color.a = 1.0;

	f_texCoord = v_texCoord;
	gl_Position = modelToClipMatrix * vec4(v_position, 1);
}
