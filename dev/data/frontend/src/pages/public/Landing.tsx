import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATH as R } from '../../config/routes.manifest';

// TODO : enhancement with animations etc? (basic for now)
export const Landing = () => {
  const navigate = useNavigate();
  const [index, setIndex] = useState<number>(0);
  const locations: string[] = ["china", "austria", "malaysia", "here"];
  
  const onNavigate = () => { navigate(R.LOGIN); }

  useEffect(() => {
    // if last word ("here"), don't start timer
    if (index === locations.length - 1) return;

    const interval = setInterval(() => {
      if (!document.hidden) {
        setIndex((prev) => {
          const nextIndex = prev + 1;
          
          // if next word is the last one ("here"), stop timer
          if (nextIndex === locations.length - 1) {
            clearInterval(interval);
          }
          
          return nextIndex;
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [index, locations.length]); // added locations.length to dependencies

  const currentWord: string = locations[index];

  return (
    <div className="h-screen w-screen bg-background flex justify-center items-center m-0 p-0 overflow-hidden">
      <div className="flex items-baseline gap-6 w-auto">
        <h1 className="font-mono text-[128px] font-bold text-accent-lime m-0 p-0 leading-none whitespace-nowrap tracking-normal">
          WorkFrom,
        </h1>
        <div className="flex items-baseline min-w-[350px]">
          {currentWord === "here" ? (
            <button 
              className="font-mono text-[64px] font-normal text-white m-0 leading-none transition-opacity duration-200 ease-in-out bg-none border-none p-0 cursor-pointer underline decoration-white/30 underline-offset-8 hover:text-accent-lime hover:decoration-accent-lime hover:-translate-y-0.5 outline-none"
              onClick={onNavigate}
            >
              {currentWord}
            </button>
          ) : (
            <span className="font-mono text-[64px] font-normal text-white m-0 leading-none transition-opacity duration-200 ease-in-out">
              {currentWord}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
