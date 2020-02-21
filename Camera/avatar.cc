#include "tools.h"
#include "avatar.h"
#include "scene.h"

Avatar::Avatar(const std::string &name, Camera * cam, float radius) :
	m_name(name), m_cam(cam), m_walk(false) {
	Vector3 P = cam->getPosition();
	m_bsph = new BSphere(P, radius);
}

Avatar::~Avatar() {
	delete m_bsph;
}

bool Avatar::walkOrFly(bool walkOrFly) {
	bool walk = m_walk;
	m_walk = walkOrFly;
	return walk;
}

//
// AdvanceAvatar: advance 'step' units
//
// @@ TODO: Change function to check for collisions. If the destination of
// avatar collides with scene, do nothing.
//
// Return: true if the avatar moved, false if not.

bool Avatar::advance(float step) {

	Node *rootNode = Scene::instance()->rootNode(); // root node of scene

	if (isColliding(rootNode)) {
		if (m_walk)
			m_cam->walk(step);
		else
			m_cam->fly(step);
		return true;
	} else return false;
}

bool Avatar::isColliding(Node *n) {
	const Node *collidingNode = n->checkCollision(m_bsph);
	bool collides = false;

	if (collidingNode != 0 && n->getGobject() != 0) collides = true; // collides with actual gObject
	else if (collidingNode != 0) { // collides with intermediate node, keep checking for collisions on children
		Node *child = n->firstChild();
		do {
			collidingNode = child->checkCollision(m_bsph);
			if (collidingNode != 0 && child->getGobject() != 0) collides = true;
			else if (collidingNode != 0) collides = isColliding(child->nextSibling());
			child = n->nextSibling();	
		} while (child != n->firstChild() and !collides);
	}
	return collides;
}

void Avatar::leftRight(float angle) {
	if (m_walk)
		m_cam->viewYWorld(angle);
	else
		m_cam->yaw(angle);
}

void Avatar::upDown(float angle) {
	m_cam->pitch(angle);
}

void Avatar::print() const { }
