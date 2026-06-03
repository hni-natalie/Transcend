import { useState, useEffect } from "react";
import { Text } from "@react-three/drei";

export function BlinkingText({ text, font, fontSize, color }) {
  const [dots, setDots] = useState('.');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '.';
        if (prev === '.') return '..';
        return '...';
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <Text
      font={font}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 2, 0]}
      fontSize={fontSize}
      color={color}
    >
      {text}{dots}
    </Text>
  );
}