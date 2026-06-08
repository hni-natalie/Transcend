// hooks/useTextWidth.js
import { useState, useCallback, useRef } from 'react';
import * as THREE from 'three';

export const useTextWidth = (padding=0.5) => {
  const [textWidth, setTextWidth] = useState({});
  const textRef = useRef({});

  const getTextWidth = useCallback(( index:number ) => {
    if (textWidth[index]) return;
    
    if (textRef.current[index]) {
      const box = new THREE.Box3().setFromObject(textRef.current[index]);
      const padding = 0.5;
      const width = box.max.x - box.min.x + padding;
      setTextWidth(prev => ({ ...prev, [index]: width }));
      console.log('set ', index, 'width to ', width);
    }
  }, [padding, textWidth]);

  return { textWidth, textRef, getTextWidth, setTextWidth };
};