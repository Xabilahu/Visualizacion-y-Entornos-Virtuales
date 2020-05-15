#include <vector>
#include "skybox.h"
#include "tools.h"
#include "vector3.h"
#include "trfm3D.h"
#include "renderState.h"
#include "gObjectManager.h"
#include "nodeManager.h"
#include "textureManager.h"
#include "materialManager.h"
#include "shaderManager.h"


using std::vector;
using std::string;

// DONE: create skybox object given gobject, shader name of cubemap texture.
//
// This function does the following:
//
// - Create a new material.
// - Assign cubemap texture to material.
// - Assign material to geometry object gobj
// - Create a new Node.
// - Assign shader to node.
// - Assign geometry object to node.
// - Set sky node in RenderState.
//
// Parameters are:
//
//   - gobj: geometry object to which assign the new material (which incluides
//           cubemap texture)
//   - skyshader: The sky shader.
//   - ctexname: The name of the cubemap texture.
//
// Useful functions:
//
//  - MaterialManager::instance()->create(const std::string & matName): create a
//    new material with name matName (has to be unique).
//  - Material::setTexture(Texture *tex): assign texture to material.
//  - GObject::setMaterial(Material *mat): assign material to geometry object.
//  - NodeManager::instance()->create(const std::string &nodeName): create a new
//    node with name nodeName (has to be unique).
//  - Node::attachShader(ShaderProgram *theShader): attach shader to node.
//  - Node::attachGobject(GObject *gobj ): attach geometry object to node.
//  - RenderState::instance()->setSkybox(Node * skynode): Set sky node.

void CreateSkybox(GObject *gobj,
				  ShaderProgram *skyshader,
				  const std::string & ctexname) {
	if (!skyshader) {
		fprintf(stderr, "[E] Skybox: no sky shader\n");
		exit(1);
	}
	Texture *ctex = TextureManager::instance()->find(ctexname);
	if (!ctex) {
		fprintf(stderr, "[E] Cubemap texture '%s' not found\n", ctexname.c_str());
		exit(1);
	}
	/* =================== PUT YOUR CODE HERE ====================== */
	string uniqueMat = "skyboxCubeMap#Material";
	string uniqueNode = "skyboxCubeMap#Node";
	MaterialManager *matM =  MaterialManager::instance();
	NodeManager *nodeM = NodeManager::instance();

	// The Skybox is only created if no other exists
	if (matM->find(uniqueMat) == 0 && nodeM->find(uniqueNode) == 0) {
		Material *skyMaterial = matM->create(uniqueMat);
		skyMaterial->setTexture(ctex);
		gobj->setMaterial(skyMaterial);
		Node *skyNode = nodeM->create(uniqueNode);
		skyNode->attachShader(skyshader);
		skyNode->attachGobject(gobj);
		RenderState::instance()->setSkybox(skyNode);
	}
	/* =================== END YOUR CODE HERE ====================== */
}

// FIXME: display the skybox
//
// This function does the following:
//
// - Store previous shader
// - Move Skybox to camera location, so that it always surrounds camera.
// - Disable depth test.
// - Set skybox shader
// - Draw skybox object.
// - Restore depth test
// - Set previous shader
//
// Parameters are:
//
//   - cam: The camera to render from
//
// Useful functions:
//
// - RenderState::instance()->getShader: get current shader.
// - RenderState::instance()->setShader(ShaderProgram * shader): set shader.
// - RenderState::instance()->push(RenderState::modelview): push MODELVIEW
//   matrix.
// - RenderState::instance()->pop(RenderState::modelview): pop MODELVIEW matrix.
// - Node::getShader(): get shader attached to node.
// - Node::getGobject(): get geometry object from node.
// - GObject::draw(): draw geometry object.
// - glDisable(GL_DEPTH_TEST): disable depth testing.
// - glEnable(GL_DEPTH_TEST): disable depth testing.

void DisplaySky(Camera *cam) {

	RenderState *rs = RenderState::instance();

	Node *skynode = rs->getSkybox();
	if (!skynode) return;

	/* =================== PUT YOUR CODE HERE ====================== */
	// Skybox is only displayed if there is an object attached to it
	if (skynode->getGobject() != 0) {
		ShaderProgram *prevShader = rs->getShader();
		rs->push(RenderState::modelview);
		Trfm3D translation;
		translation.setTrans(cam->getPosition());
		rs->addTrfm(RenderState::modelview, &translation);
		glDisable(GL_DEPTH_TEST);
		rs->setShader(skynode->getShader());
		skynode->getGobject()->draw();
		rs->pop(RenderState::modelview);
		glEnable(GL_DEPTH_TEST);
		rs->setShader(prevShader);
	}
	/* =================== END YOUR CODE HERE ====================== */
}
