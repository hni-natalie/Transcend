/*
  Keyboard context for keypress handling across pages
  export as useKeyboard(), KeyboardProvider
*/

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const KeyboardContext    = createContext(null);
export const useKeyboard = () => useContext(KeyboardContext);

export function KeyboardProvider ({ children }) {
	const [keys, setKeys] = useState({
		// movement keys
		w: false, s: false, a: false, d: false,
		ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,

		// modifier keys
		Control: false, Shift: false, Alt: false, Meta: false
	});

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const key = e.key;
			// console.log('Key pressed:', key);

			const normalizedKey = key.length === 1 ? key.toLowerCase() : key;
			if (keys.hasOwnProperty(normalizedKey)) {
				setKeys(prev => ({ ...prev, [normalizedKey]: true }));
			}
		};
		const handleKeyUp = (e: KeyboardEvent) => {
			const key = e.key;
			const normalizedKey = key.length === 1 ? key.toLowerCase() : key;
			if (keys.hasOwnProperty(normalizedKey)) {
				setKeys(prev => ({ ...prev, [normalizedKey]: false }));
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, []);

	const isMoveKey = () => {
			// console.log("w: ", keys.w, "s: ", keys.s, "a: ", keys.a, "d: ", keys.d, "arrow: ", keys.ArrowUp);
			return (keys.w || keys.s || keys.a || keys.d ||
						keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight);
	}

	const isModifierKey = () => {
		return (keys.Shift || keys.Control || keys.Alt || keys.Meta);
	}

	/* ***********************************************
	 * Mouse logics
	 * ***********************************************/
  const isDragging = useRef(false);
  const isMouseDown = useRef(false);
  const hasMouseMoved = useRef(false);
  const startPosition = useRef({ x: 0, y: 0 });
	
	const handlePointerDown = (e: PointerEvent) => {
		isMouseDown.current = true;
		hasMouseMoved.current = false;
		startPosition.current = { x: e.clientX, y: e.clientY };
		isDragging.current = false;
		// console.log('mouse ddddown!');
	};

	const handlePointerMove = (e: PointerEvent) => {
		if (!isMouseDown.current) return;
		
		// Check if mouse has moved significantly (threshold for drag)
		const dx = e.clientX - startPosition.current.x;
		const dy = e.clientY - startPosition.current.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		
		if (distance > 2) { // 5px threshold
			hasMouseMoved.current = true;
			isDragging.current = true;
			// console.log('mouse ddddrag!');
		}
	};

	const handlePointerUp = (e: PointerEvent) => {
		// Only trigger click if mouse didn't move
		if (!isMouseDown.current)
			return ;
		// if (isDragging.current)
		// 	console.log('✅ mouse drag detected!');
		// else
		// 	console.log('✅ mouse click detected!');
		reset();
		// console.log('mouse pointer up!');
	};
  const reset = useCallback(() => {
    isMouseDown.current = false;
    hasMouseMoved.current = false;
    isDragging.current = false;
  }, []);

	useEffect(() => {
    // ✅ Attach listeners
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);

    // ✅ Cleanup
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

	const value = {
		keys,
		isMoveKey,
		isModifierKey,
		isDragging,
		isMouseDown
	};

	return (
		<KeyboardContext.Provider value={value}>
			{children}
		</KeyboardContext.Provider>
	);
}