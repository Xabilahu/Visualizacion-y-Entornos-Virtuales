# Proyecto de la asignatura Visualización y Entornos Virtuales

En la práctica se van a trabajar especialmente los siguientes temas:

- Geometría básica
- Transformaciones geométricas
- Grafo de la escena
- Cámara
- Avatar y colisiones
- Luces y materiales

## 1. Geometría básica

- Implementar las siguientes funciones incluidas en el fichero **Math/line.cc**:

    ```cpp
    void Line::setFromAtoB(const Vector3 & A, const Vector3 & B);
    Vector3 Line::at(float u) const;
    float Line::paramDistance(const Vector3 & P) const;
    float Line::distance(const Vector3 & P) const;
    ``` 

- Implementar las siguientes funciones incluidas en el fichero **Math/intersect.cc**:

    ```cpp
    int BSpherePlaneIntersect(const BSphere *bs, Plane *pl);
    int BBoxBBoxIntersect(const BBox *bba, const BBox *bbb );
    int BBoxPlaneIntersect(const BBox *theBBox, Plane *thePlane);
    ```

Nota: Para visualizar los resultados de este apartado se utilizará el programa **Math/test**.

## 2. Transformaciones geométricas

- Implementar las siguientes funciones incluidas en el fichero **Math/trfm3D.cc**:

    ```cpp
    Vector3 Trfm3D::transformPoint(const Vector3 & P) const;
    Vector3 Trfm3D::transformVector(const Vector3 & V) const;
    void Trfm3D::setRotAxis(const Vector3 & V, const Vector3 & P, float angle );
    ```

Nota: Para visualizar los resultados de este apartado se utilizará el programa **browser_gobj** y se realizará una modificación en **elshaderShader/dummy.vert**


## 3. Grafo de la escena

Inicialmente se puede considerar que la transformación parcial de cada nodo gestionará la localización LOCAL (**m_placement**). Esto es, la posición y la orientación de un nodo viene dado por sus progenitores. 

No obstante, finalmente, se debe gestionar la transformación que localiza un nodo en el mundo directamente (**m_placementWC**). Esta última transformación actúa como una memoria caché y se utiliza para aligerar el cálculo computacional de la aplicación. Mediante ello, no se tienen que componer las transformaciones del nodo en cada frame. Eso sí, si se mueve un nodo, se debe actualizar su transformación **mplacementWC** y también la de sus hijos.

Si se considera que la transformación parcial de cada nodo es LOCAL, simplemente se pueden implementar las siguientes funciones en el fichero **SceneGraph/node.cc**:

```cpp
void Node::addChild(Node *theChild);
void Node::draw();
```

Por el contrario, si se considera que las transformaciones son GLOBALES, se deben implementar las siguientes funciones en el fichero **SceneGraph/node.cc**:

```cpp
void Node::addChild(Node *theChild);
void Node::propagateBBRoot();
void Node::updateBB();
void Node::updateWC():
void Node::updateGS();
void Node::draw();
```

Nota: Para visualizar los resultados de este apartado se utilizará el programa **browser**.

## 4. Cámara

- Implementar las siguientes funciones incluidas en el fichero **Camera/camera.cc**:

    ```cpp
    void PerspectiveCamera::updateProjection();
    void Camera::updateFrame();
    ```

## 5. Avatar y colisiones

- Implementar la siguiente función incluida en el fichero **Camera/avatar.cc** y comprobar que el avatar no se choca con los objetos de la escena.

    ```cpp
    bool Avatar::advance(float step);
    ```

- Por ello, se va a implementar la siguiente función incluida en el fichero **Scene/node.cc**:

    ```cpp
    const Node *Node::checkCollision(const BSphere *bsph) const;
    ```

## 6. Luces y materiales

- Implementar la siguiente función incluida en el fichero **Shading/light.cc**:

    ```cpp
    void Light::placeScene();
    ```

- Además, se debe añadir el código correspondiente a las siguientes luces en los ficheros:

    - **Shaders/pervertex.vert**
    - **Shaders/pervertex.frag**

para las siguientes luces:

- Una luz posicional (con atenuación de la luz).
- Dos luces direccionales.
- Una luz del tipo *spotlight* (sin atenuación de la luz) en la escena que se moverá con la cámara.

Autor: [Xabier Lahuerta Vázquez](https://github.com/Xabilahu)