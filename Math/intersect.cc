#include <cmath>
#include "intersect.h"
#include "constants.h"
#include "tools.h"

/* | algo           | difficulty | */
/* |----------------+------------| */
/* | BSPherePlane   |          1 | */
/* | BBoxBBox       |          2 | */
/* | BBoxPlane      |          4 | */

// @@ DONE: test if a BSpheres intersects a plane.
//! Returns :
//   +IREJECT outside
//   -IREJECT inside
//    IINTERSECT intersect

int BSpherePlaneIntersect(const BSphere *bs, Plane *pl) {
	if (pl->distance(bs->getPosition()) > bs->getRadius()){
		if (pl->whichSide(bs->getPosition()) < 0) return -IREJECT;
		else return +IREJECT;
	} else return IINTERSECT;
}


// @@ DONE: test if two BBoxes intersect.
//! Returns :
//    IINTERSECT intersect
//    IREJECT don't intersect

int  BBoxBBoxIntersect(const BBox *bba, const BBox *bbb ) {
	if (bba->m_min.x() > bbb->m_max.x() || bbb->m_min.x() > bba->m_max.x()) return IREJECT;
	if (bba->m_min.y() > bbb->m_max.y() || bbb->m_min.y() > bba->m_max.y()) return IREJECT;
	if (bba->m_min.z() > bbb->m_max.z() || bbb->m_min.z() > bba->m_max.z()) return IREJECT;
	else return IINTERSECT;	
}

// @@ DONE: test if a BBox and a plane intersect.
//! Returns :
//   +IREJECT outside
//   -IREJECT inside
//    IINTERSECT intersect

int  BBoxPlaneIntersect (const BBox *theBBox, Plane *thePlane) {
	float x1, x2, y1, y2, angle, minAngle = 500;
	Vector3 auxP1, auxP2, diagP1, diagP2;
	Line diag;

	for(int i = 0; i < 2; i++){

		if (i == 0){ 
			x1 = theBBox->m_max.x();
			x2 = theBBox->m_min.x();
		} else {
			x1 = theBBox->m_min.x();
			x2 = theBBox->m_max.x();
		}

		for (int j = 0; j < 2; j++){

			if (j == 0) {
				y1 = theBBox->m_max.y();
				y2 = theBBox->m_min.y();
			} else {
				y1 = theBBox->m_min.y();
				y2 = theBBox->m_max.y();
			}

			auxP1 = Vector3(x1, y1, theBBox->m_max.z());
			auxP2 = Vector3(x2, y2, theBBox->m_min.z());
			diag = Line();
			diag.setFromAtoB(auxP1, auxP2);
			angle = acosf((diag.m_d.dot(thePlane->m_n) / (diag.m_d.length() * thePlane->m_n.length())));

			if (angle < minAngle) {
				minAngle = angle;
				diagP1 = auxP1;
				diagP2 = auxP2;
			}
		}
	}

	int sideP1 = thePlane->whichSide(diagP1);
	int sideP2 = thePlane->whichSide(diagP2);
	
	if (sideP1 == sideP2) return sideP1;
	else return IINTERSECT;

}

// Test if two BSpheres intersect.
//! Returns :
//    IREJECT don't intersect
//    IINTERSECT intersect

int BSphereBSphereIntersect(const BSphere *bsa, const BSphere *bsb ) {

	Vector3 v;
	v = bsa->m_centre - bsb->m_centre;
	float ls = v.dot(v);
	float rs = bsa->m_radius + bsb->m_radius;
	if (ls > (rs * rs)) return IREJECT; // Disjoint
	return IINTERSECT; // Intersect
}


// Test if a BSpheres intersect a BBox.
//! Returns :
//    IREJECT don't intersect
//    IINTERSECT intersect

int BSphereBBoxIntersect(const BSphere *sphere, const BBox *box) {

	float d;
	float aux;
	float r;

	r = sphere->m_radius;
	d = 0;

	aux = sphere->m_centre[0] - box->m_min[0];
	if (aux < 0) {
		if (aux < -r) return IREJECT;
		d += aux*aux;
	} else {
		aux = sphere->m_centre[0] - box->m_max[0];
		if (aux > 0) {
			if (aux > r) return IREJECT;
			d += aux*aux;
		}
	}

	aux = (sphere->m_centre[1] - box->m_min[1]);
	if (aux < 0) {
		if (aux < -r) return IREJECT;
		d += aux*aux;
	} else {
		aux = sphere->m_centre[1] - box->m_max[1];
		if (aux > 0) {
			if (aux > r) return IREJECT;
			d += aux*aux;
		}
	}

	aux = sphere->m_centre[2] - box->m_min[2];
	if (aux < 0) {
		if (aux < -r) return IREJECT;
		d += aux*aux;
	} else {
		aux = sphere->m_centre[2] - box->m_max[2];
		if (aux > 0) {
			if (aux > r) return IREJECT;
			d += aux*aux;
		}
	}
	if (d > r * r) return IREJECT;
	return IINTERSECT;
}

// Test if a Triangle intersects a ray.
//! Returns :
//    IREJECT don't intersect
//    IINTERSECT intersect

int IntersectTriangleRay(const Vector3 & P0,
						 const Vector3 & P1,
						 const Vector3 & P2,
						 const Line *l,
						 Vector3 & uvw) {
	Vector3 e1(P1 - P0);
	Vector3 e2(P2 - P0);
	Vector3 p(crossVectors(l->m_d, e2));
	float a = e1.dot(p);
	if (fabs(a) < Constants::distance_epsilon) return IREJECT;
	float f = 1.0f / a;
	// s = l->o - P0
	Vector3 s(l->m_O - P0);
	float lu = f * s.dot(p);
	if (lu < 0.0 || lu > 1.0) return IREJECT;
	Vector3 q(crossVectors(s, e1));
	float lv = f * q.dot(l->m_d);
	if (lv < 0.0 || lv > 1.0) return IREJECT;
	uvw[0] = lu;
	uvw[1] = lv;
	uvw[2] = f * e2.dot(q);
	return IINTERSECT;
}

/* IREJECT 1 */
/* IINTERSECT 0 */

const char *intersect_string(int intersect) {

	static const char *iint = "IINTERSECT";
	static const char *prej = "IREJECT";
	static const char *mrej = "-IREJECT";
	static const char *error = "IERROR";

	const char *result = error;

	switch (intersect) {
	case IINTERSECT:
		result = iint;
		break;
	case +IREJECT:
		result = prej;
		break;
	case -IREJECT:
		result = mrej;
		break;
	}
	return result;
}
