#version 120

uniform int active_lights_n; // Number of active lights (< MG_MAX_LIGHT)
uniform vec3 scene_ambient; // Scene ambient light

struct material_t {
	vec3  diffuse;
	vec3  specular;
	float alpha;
	float shininess;
};

struct light_t {
	vec4 position;    // Camera space
	vec3 diffuse;     // rgb
	vec3 specular;    // rgb
	vec3 attenuation; // (constant, lineal, quadratic)
	vec3 spotDir;     // Camera space
	float cosCutOff;  // cutOff cosine
	float exponent;
};

uniform light_t theLights[4];
uniform material_t theMaterial;

uniform sampler2D texture0;
uniform sampler2D bumpmap;

varying vec2 f_texCoord;
varying vec3 f_viewDirection;     // tangent space
varying vec3 f_lightDirection[4]; // tangent space
varying vec3 f_spotDirection[4];  // tangent space

const float epsilon = 0.0001;

float lambert_factor(vec3 n, vec3 l){ //normalized vecs
	return max(0.0, dot(n, l));
}

float specular_factor(vec3 n, vec3 l, vec3 v, float m){
	vec3 r = normalize(2.0 * dot(n, l) * n - l);
	float RoV = dot(r, v);
	float returnValue = 0.0;
	if (RoV > epsilon) returnValue = max(0.0, pow(RoV, m));
	return returnValue;
}

void directionalLight(int i, vec3 lightDirection, vec3 viewDirection, vec3 normal, inout vec3 diffuse, inout vec3 specular) {
	float diffuse_factor = lambert_factor(normal, lightDirection);
	diffuse += diffuse_factor * theLights[i].diffuse;
	specular += specular_factor(normal, lightDirection, viewDirection, theMaterial.shininess) * theLights[i].specular * diffuse_factor;
}

void positionalLight(int i, vec3 lightDirection, vec3 viewDirection, vec3 normal, inout vec3 diffuse, inout vec3 specular) {
	float diffuse_factor = lambert_factor(normal, lightDirection);
	diffuse += diffuse_factor * theLights[i].diffuse;
	specular += specular_factor(normal, lightDirection, viewDirection, theMaterial.shininess) * theLights[i].specular * diffuse_factor;
}

void spotLight(int i, vec3 lightDirection, vec3 viewDirection, vec3 spotDirection, vec3 normal, inout vec3 diffuse, inout vec3 specular){

	float cspot, diffuse_factor;
	float SoL = max(0.0, dot(-lightDirection, spotDirection));

	if (theLights[i].cosCutOff < SoL){
		if (SoL > epsilon){
			cspot = pow(SoL, theLights[i].exponent);
			diffuse_factor = lambert_factor(normal, lightDirection);
			diffuse += diffuse_factor * theLights[i].diffuse * cspot;
			specular += specular_factor(normal, lightDirection, viewDirection, theMaterial.shininess) * theLights[i].specular * diffuse_factor * cspot;
		}
	}
}

void main() {
	vec4 color, spec, texColor;
	vec3 diffuse_color, specular_color, viewDirection, lightDirection;
	float d; int i;
	// Retrieve Normal Coords in range [0,1] -> convert to [-1,1]
	vec3 normalBump = normalize(2.0 * texture2D(bumpmap, f_texCoord).rgb - 1.0);
	diffuse_color = vec3(0.0);
	specular_color = vec3(0.0);
	viewDirection = normalize(f_viewDirection);

	for (i = 0; i < active_lights_n; i++){
		lightDirection = normalize(f_lightDirection[i]);
		if (theLights[i].position[3] == 0.0) { //Directional light
			directionalLight(i, lightDirection, viewDirection, normalBump, diffuse_color, specular_color);
		} else if (theLights[i].cosCutOff < epsilon){ //Positional light (spotCutOff = 90 -> cosSpotCutOff = 0)
			positionalLight(i, lightDirection, viewDirection, normalBump, diffuse_color, specular_color);
		} else{
			spotLight(i, lightDirection, viewDirection, normalize(f_spotDirection[i]), normalBump, diffuse_color, specular_color);
		}
	}

	spec.rgb = specular_color * theMaterial.specular;
	spec.a = 1.0;
	color.rgb = scene_ambient + diffuse_color * theMaterial.diffuse;
	color.a = 1.0;

	texColor = texture2D(texture0, f_texCoord);

	gl_FragColor = color * texColor + spec;

}
