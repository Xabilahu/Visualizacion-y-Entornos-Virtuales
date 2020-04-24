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

uniform sampler2D texture0;

varying vec3 f_position;      // camera space
varying vec3 f_viewDirection; // camera space
varying vec3 f_normal;        // camera space
varying vec2 f_texCoord;

const float epsilon = 0.0001;

float lambert_factor(vec3 n, vec3 l){ //normalized vecs
	return max(0.0, dot(n, l));
}

float specular_factor(vec3 n, vec3 l, vec3 v, float m){
	vec3 r = normalize(2 * dot(n, l) * n - l);
	float RoV = dot(r, v);
	if (RoV > epsilon)
		return max(0.0, pow(RoV, m));
	else
		return 0.0;
}

float attenuation_factor(int index, float d){
	float denom = theLights[index].attenuation[0] + theLights[index].attenuation[1] * d + theLights[index].attenuation[2] * d * d;
	if (denom > epsilon) return 1 / denom;
	else return 1;
}

void directionalLight(int i, vec3 viewDirection, vec3 normal, inout vec3 diffuse, inout vec3 specular) {
	vec3 L = normalize(-theLights[i].position.xyz);
	float diffuse_factor = lambert_factor(normal, L);
	diffuse += diffuse_factor * theLights[i].diffuse;
	specular += specular_factor(normal, L, viewDirection, theMaterial.shininess) * theLights[i].specular * diffuse_factor;
}

void positionalLight(int i, float d, vec3 lightDirection, vec3 viewDirection, vec3 normal, inout vec3 diffuse, inout vec3 specular) {
	float diffuse_factor = lambert_factor(normal, lightDirection);
	float att = attenuation_factor(i, d);
	diffuse += diffuse_factor * theLights[i].diffuse * att;
	specular += specular_factor(normal, lightDirection, viewDirection, theMaterial.shininess) * theLights[i].specular * diffuse_factor * att;
}

void spotLight(int i, float d, vec3 lightDirection, vec3 viewDirection, vec3 normal, inout vec3 diffuse, inout vec3 specular){

	float cspot, diffuse_factor;
	float SoL = max(0.0, dot(-lightDirection, theLights[i].spotDir));

	if (theLights[i].cosCutOff < SoL && SoL > epsilon){
		cspot = pow(SoL, theLights[i].exponent);
		diffuse_factor = lambert_factor(normal, lightDirection);
		diffuse += diffuse_factor * theLights[i].diffuse * cspot;
		specular += specular_factor(normal, lightDirection, viewDirection, theMaterial.shininess) * theLights[i].specular * diffuse_factor * cspot;
	}
}

void main() {
	vec4 color, spec, texColor;
	vec3 positionEye, normalEye, L, diffuse_color, specular_color, v;
	float d;
	positionEye = f_position; 
	normalEye = normalize(f_normal);
	diffuse_color = vec3(0.0);
	specular_color = vec3(0.0);
	v = normalize(f_viewDirection);

	for (int i = 0; i < active_lights_n; i++){
		if (theLights[i].position[3] == 0) { //Directional light
			directionalLight(i, v, normalEye, diffuse_color, specular_color);
		} else {
			d = length(theLights[i].position.xyz - positionEye);
			if (d > epsilon) { //Check denominator to avoid dividing by 0
				L = normalize(theLights[i].position.xyz - positionEye);
				if (theLights[i].cosCutOff < epsilon){ //Positional light (spotCutOff = 90 -> cosSpotCutOff = 0)
					positionalLight(i, d, L, v, normalEye, diffuse_color, specular_color);
				} else {
					spotLight(i, d, L, v, normalEye, diffuse_color, specular_color);
				}
			}
		}
	}

	spec.rgb = specular_color * theMaterial.specular;
	spec.a = 1.0;
	color.rgb = scene_ambient + diffuse_color * theMaterial.diffuse;
	color.a = 1.0;

	texColor = texture2D(texture0, f_texCoord);

	gl_FragColor = color * texColor + spec;

}
