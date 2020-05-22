#version 120

uniform int active_lights_n; // Number of active lights (< MG_MAX_LIGHT)
uniform vec3 scene_ambient; // Scene ambient light

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

uniform vec3 campos; // Camera position in world space

uniform sampler2D texture0;   // Texture
uniform samplerCube envmap;   // Environment map (cubemap)

varying vec3 f_position;      // camera space
varying vec3 f_viewDirection; // camera space
varying vec3 f_normal;        // camera space
varying vec2 f_texCoord;
varying vec3 f_positionw;    // world space
varying vec3 f_normalw;      // world space

const float epsilon = 0.0001;

float lambert_factor(vec3 n, vec3 l){ //normalized vecs
	return max(0.0, dot(n, l));
}

vec3 reflection(vec3 v1, vec3 v2) {
	return 2.0 * dot(v1, v2) * v1 - v2;
}

float specular_factor(vec3 n, vec3 l, vec3 v, float m){
	vec3 r = normalize(reflection(n, l));
	float RoV = dot(r, v);
	float returnValue = 0.0;
	if (RoV > epsilon) returnValue = pow(RoV, m);
	return returnValue;
}

void directionalLight(int i, vec3 viewDirection, vec3 normal, inout vec3 diffuse, inout vec3 specular) {
	vec3 L = normalize(-theLights[i].position.xyz);
	float diffuse_factor = lambert_factor(normal, L);
	diffuse += diffuse_factor * theLights[i].diffuse;
	specular += specular_factor(normal, L, viewDirection, theMaterial.shininess) * theLights[i].specular * diffuse_factor;
}

void positionalLight(int i, vec3 lightDirection, vec3 viewDirection, vec3 normal, inout vec3 diffuse, inout vec3 specular) {
	float diffuse_factor = lambert_factor(normal, lightDirection);
	diffuse += diffuse_factor * theLights[i].diffuse;
	specular += specular_factor(normal, lightDirection, viewDirection, theMaterial.shininess) * theLights[i].specular * diffuse_factor;
}

void spotLight(int i, vec3 lightDirection, vec3 viewDirection, vec3 normal, inout vec3 diffuse, inout vec3 specular){

	float cspot, diffuse_factor;
	float SoL = max(0.0, dot(-lightDirection, theLights[i].spotDir));

	if (theLights[i].cosCutOff < SoL) { 
		if (SoL > epsilon){
			cspot = pow(SoL, theLights[i].exponent);
			diffuse_factor = lambert_factor(normal, lightDirection);
			diffuse += diffuse_factor * theLights[i].diffuse * cspot;
			specular += specular_factor(normal, lightDirection, viewDirection, theMaterial.shininess) * theLights[i].specular * diffuse_factor * cspot;
		}
	}
}

void main() {
	vec4 color, spec, texColor, envMapColor;
	vec3 positionEye, normalEye, L, diffuse_color, specular_color, v, I, R;
	int i;
	positionEye = f_position; 
	normalEye = normalize(f_normal);
	diffuse_color = vec3(0.0);
	specular_color = vec3(0.0);
	v = normalize(f_viewDirection);

	for (i = 0; i < active_lights_n; i++){
		if (theLights[i].position[3] == 0.0) { //Directional light
			directionalLight(i, v, normalEye, diffuse_color, specular_color);
		} else {
			L = normalize(theLights[i].position.xyz - positionEye);
			if (theLights[i].cosCutOff < epsilon){ //Positional light (spotCutOff = 90 -> cosSpotCutOff = 0)
				positionalLight(i, L, v, normalEye, diffuse_color, specular_color);
			} else {
				spotLight(i, L, v, normalEye, diffuse_color, specular_color);
			}
		}
	}

	spec.rgb = specular_color * theMaterial.specular;
	spec.a = 1.0;
	color.rgb = scene_ambient + diffuse_color * theMaterial.diffuse;
	color.a = 1.0;

	texColor = texture2D(texture0, f_texCoord);

	I = normalize(campos - f_positionw);
	R = reflection(f_normalw, I);
	R[2] = - R[2];
	envMapColor = textureCube(envmap, R);

	gl_FragColor = color * texColor * envMapColor + spec;

}
