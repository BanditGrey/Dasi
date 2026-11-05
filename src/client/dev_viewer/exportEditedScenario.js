/** Cria um snapshot estático sem modificar a cena viva do visualizador. */
export function buildEditedScenarioSnapshot(THREE, source) {
  const materials = new Map();
  const matrix = new THREE.Matrix4();
  const color = new THREE.Color();
  function tintedMaterial(material, tint) {
    let colors = materials.get(material);
    if (!colors) { colors = new Map(); materials.set(material, colors); }
    const key = `${tint.r},${tint.g},${tint.b}`;
    if (!colors.has(key)) {
      const clone = material.clone();
      if (clone.color) clone.color.multiply(tint);
      colors.set(key, clone);
    }
    return colors.get(key);
  }
  function copyNode(node) {
    if (!node.visible || node.isLight || node.isPoints || node.userData?.runtimeOnly) return null;
    let copy;
    if (node.isInstancedMesh) {
      copy = new THREE.Group();
      copy.name = node.name;
      copy.position.copy(node.position);
      copy.quaternion.copy(node.quaternion);
      copy.scale.copy(node.scale);
      copy.matrix.copy(node.matrix);
      copy.matrixAutoUpdate = node.matrixAutoUpdate;
      for (let i = 0; i < node.count; i++) {
        node.getMatrixAt(i, matrix);
        // Células fora da superfície ou módulos ausentes têm escala zero.
        if (Math.abs(matrix.determinant()) < 1e-12) continue;
        let material = node.material;
        if (node.instanceColor) {
          node.getColorAt(i, color);
          material = Array.isArray(material) ? material.map(m => tintedMaterial(m, color)) : tintedMaterial(material, color);
        }
        const instance = new THREE.Mesh(node.geometry, material);
        instance.name = `${node.name}_${i}`;
        instance.matrix.copy(matrix);
        instance.matrix.decompose(instance.position, instance.quaternion, instance.scale);
        copy.add(instance);
      }
    } else {
      copy = node.clone(false);
    }
    for (const child of node.children) {
      const childCopy = copyNode(child);
      if (childCopy) copy.add(childCopy);
    }
    return copy;
  }
  return copyNode(source);
}
