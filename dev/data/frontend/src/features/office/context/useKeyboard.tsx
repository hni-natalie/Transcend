/*
  Keyboard context for keypress handling across pages
  export as useKeyboard(), KeyboardProvider
*/

import React, { createContext, useContext, useState, useEffect } from 'react';

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

	const value = {
		keys,
		isMoveKey,
		isModifierKey
	};

	return (
		<KeyboardContext.Provider value={value}>
			{children}
		</KeyboardContext.Provider>
	);
}