import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';

export type OfficeObjectAction = 'share-window-audio';

export interface TouchedOfficeObject {
	id: string;
	action: OfficeObjectAction;
}

interface OfficeInteractionContextType {
	touchedObject: TouchedOfficeObject | null;
  handleTouch: (objectId: string, action: OfficeObjectAction) => void;
	setTouchedObject: Dispatch<SetStateAction<TouchedOfficeObject | null>>;
}

const OfficeInteractionContext = createContext<OfficeInteractionContextType | null>(null);

export function useOfficeInteraction() {
	const context = useContext(OfficeInteractionContext);
	if (!context) {
		throw new Error('useOfficeInteraction must be used within an OfficeInteractionProvider');
	}
	return context;
}

export function OfficeInteractionProvider({ children }: { children: ReactNode }) {
	const [touchedObject, setTouchedObject] = useState<TouchedOfficeObject | null>(null);

	const handleTouch = useCallback(( objectId:string, action:OfficeObjectAction ) => {
		setTouchedObject({ id: objectId || 'unknown', action: action });
	}, []);
	
	const value = useMemo(() => ({
		touchedObject,
		setTouchedObject,
		handleTouch,
	}), [touchedObject, handleTouch]);

	return (
		<OfficeInteractionContext.Provider value={value}>
			{children}
		</OfficeInteractionContext.Provider>
	);
}
