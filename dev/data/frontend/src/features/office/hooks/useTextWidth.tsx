// hooks/useTextWidth.js
import { useState, useCallback, useRef } from 'react';
import * as THREE from 'three';

export const useTextWidth = (padding=0.5) => {
  const [textWidth, setTextWidth] = useState(10);
  const textRef = useRef(null);
  // const textRef = useRef({});

  const getTextWidth = useCallback(() => {
    if (textRef.current) {
			const box = new THREE.Box3().setFromObject(textRef.current);
			const padding = 0.5;
			const width = box.max.x - box.min.x + padding;
			setTextWidth(width);
    }
  }, [padding]);

  return { textWidth, textRef, getTextWidth, setTextWidth };
};