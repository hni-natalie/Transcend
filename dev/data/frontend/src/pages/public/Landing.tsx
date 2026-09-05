import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATH as R } from '@config/routes.manifest';
import { IconArrowUpRight, IconTaskAdd, IconTaskDone, IconMeetingAdd, IconOffice, IconVideo, IconLogin } from '@shared';

export const Landing = () => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCursorPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const onNavigate = () => {
    navigate(R.LOGIN);
  };

  const IconCircle = ({ bgClass, iconClass, children }: { bgClass: string; iconClass?: string; children?: React.ReactNode }) => (
    <span className={`inline-flex items-center justify-center w-[0.58em] h-[0.58em] rounded-full mx-[0.02em] align-middle translate-y-[0.12em] ${bgClass}`}>
      <span className={`w-[55%] h-[55%] flex items-center justify-center ${iconClass || 'text-background'}`}>
        {children}
      </span>
    </span>
  );

  return (
    <div className="h-screen w-screen bg-background relative flex flex-col justify-between p-6 md:p-10 overflow-hidden select-none">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 60s linear infinite;
        }
        .link-text {
          display: inline-block;
          overflow: hidden;
          position: relative;
        }
        .link-text .top {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          transition: transform 0.3s cubic-bezier(0.76, 0, 0.24, 1);
        }
        .link-text .bottom {
          position: absolute;
          top: 0;
          left: 0;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          transform: translateY(100%);
          transition: transform 0.3s cubic-bezier(0.76, 0, 0.24, 1);
        }
        .group:hover .link-text .top {
          transform: translateY(-100%);
        }
        .group:hover .link-text .bottom {
          transform: translateY(0);
        }
      `}</style>

      {/* TOP HEADER */}
      <header className="relative w-full flex justify-between items-center z-30">
        <span className="brand-logo-lean text-4xl font-bold tracking-tight text-accent-lime cursor-default">
          WorkFrom,
        </span>

        <div className="text-[12px] font-main text-foreground-3 text-left w-full md:w-[380px] lg:w-[440px] md:translate-x-24 lg:translate-x-26">
          The Virtual Workspace App.
        </div>
      </header>

      {/* HERO STAGE */}
      <main className="relative flex-1 w-full z-10 flex flex-col md:flex-row items-center justify-between gap-8 py-4">
        {/* Left: Illustration */}
        <div className="flex-1 flex justify-center md:justify-start items-center h-full">
          <img
            src="/WF_Landing.png"
            alt="WorkFrom Illustration"
            className="ml-12 mt-5 max-h-[58vh] md:max-h-[68vh] w-auto object-contain pointer-events-none select-none"
          />
        </div>

        {/* Right: Typography Block - Left aligned text */}
        <div className="w-full md:w-[380px] lg:w-[440px] flex flex-col justify-center space-y-6 text-left md:translate-x-24 lg:translate-x-26">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-normal tracking-[0.01rem] text-white leading-[1.1]">
            Work from<br />
            anywhere.<br />
            Connect from<br />
            <button
              type="button"
              onClick={onNavigate}
              className="group bg-transparent border-none p-0 cursor-pointer align-baseline"
            >
              <span className="link-text">
                <span className="top inline-flex items-center gap-1 text-accent-lime">
                  here.
                  <IconArrowUpRight className="w-[0.6em] h-[0.6em]" />
                </span>
                <span className="bottom inline-flex items-center gap-1 text-accent-lime">
                  here.
                  <IconArrowUpRight className="w-[0.6em] h-[0.6em]" />
                </span>
              </span>
            </button>
          </h1>
          <p className="text-sm md:text-base text-foreground-3 leading-relaxed max-w-sm tracking-[0.03em]">
            Bring your team together with real-time presence, meetings, tasks, and collaboration in one shared workspace.
          </p>
        </div>
      </main>

      {/* CONTINUOUS MOVING TICKER (3 VARIATIONS) */}
      <div className="-mx-6 md:-mx-10 z-30 mb-4">
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onMouseMove={handleMouseMove}
          onClick={onNavigate}
          className="relative w-full overflow-hidden cursor-none py-2 flex items-center"
        >
          <div className="animate-marquee whitespace-nowrap flex items-center gap-12 sm:gap-16">
            {[...Array(2)].map((_, loopIdx) => (
              <React.Fragment key={loopIdx}>
                {/* VARIATION 1: Cyan Badge + Dark Badge */}
                <h1 className="font-main text-6xl sm:text-8xl md:text-[110px] tracking-tight text-accent-lime pointer-events-none select-none leading-none inline-flex items-center">
                  W
                  <IconCircle bgClass="bg-[#68D1BF]">
                    <IconTaskDone className="stroke-[2] translate-x-[6px] translate-y-[2px]" />
                  </IconCircle>
                  rkFr
                  <IconCircle bgClass="bg-[#242C2A]" iconClass="text-[#68D1BF]">
                    <IconTaskAdd className="stroke-[5] translate-x-[6px] translate-y-[2px]" />
                  </IconCircle>
                  m,
                </h1>

                {/* VARIATION 2: Gold Badge + Dark Badge + Parentheses */}
                <h1 className="font-main text-6xl sm:text-8xl md:text-[110px] tracking-tight text-accent-lime pointer-events-none select-none leading-none inline-flex items-center">
                  W
                  <IconCircle bgClass="bg-[#EECA5C]/90">
                    <IconMeetingAdd className="translate-x-[1px]" />
                  </IconCircle>
                  rk(Fr
                  <IconCircle bgClass="bg-[#2B2E24]" iconClass="text-accent-lime">
                    <IconOffice className="w-full h-full scale-100" />
                  </IconCircle>
                  m),
                </h1>

                {/* VARIATION 3: Yellow Badge + Lime Badge */}
                <h1 className="font-main text-6xl sm:text-8xl md:text-[110px] tracking-tight text-accent-lime pointer-events-none select-none leading-none inline-flex items-center">
                  W
                  <IconCircle bgClass="bg-[#EECA5C]">
                    <IconVideo className="stroke-[1.2] w-full h-full scale-140 translate-x-[2px]" />
                  </IconCircle>
                  rkFr
                  <IconCircle bgClass="bg-accent-lime">
                    <IconLogin className="-translate-x-[3px]" />
                  </IconCircle>
                  m,
                </h1>
              </React.Fragment>
            ))}
          </div>

          {isHovered && (
            <div
              className="absolute pointer-events-none font-mono italic text-5xl font-bold text-white tracking-widest whitespace-nowrap mix-blend-difference z-40"
              style={{
                left: `${cursorPos.x}px`,
                top: `${cursorPos.y}px`,
                transform: 'translate(-50%, -50%)',
                letterSpacing: '-0.02em',
                fontSynthesis: 'style',
              }}
            >
              here
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="w-full flex justify-between items-center z-30 text-sm">
        <span className="text-foreground-4">
          WorkFrom 2026 ™
        </span>

        <div className="w-full md:w-[380px] lg:w-[440px] flex items-center gap-10 font-main text-foreground-3 md:translate-x-24 lg:translate-x-26">
          <button
            type="button"
            onClick={() => navigate(R.TERMS)}
            className="bg-transparent border-none p-0 cursor-pointer no-underline transition-colors group"
          >
            <span className="link-text">
              <span className="top">
                Terms
                <IconArrowUpRight className="w-3.5 h-3.5" />
              </span>
              <span className="bottom text-accent-lime">
                Terms
                <IconArrowUpRight className="w-3.5 h-3.5 text-accent-lime" />
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate(R.PRIVACY)}
            className="bg-transparent border-none p-0 cursor-pointer no-underline transition-colors group"
          >
            <span className="link-text">
              <span className="top">
                Privacy
                <IconArrowUpRight className="w-3.5 h-3.5" />
              </span>
              <span className="bottom text-accent-lime">
                Privacy
                <IconArrowUpRight className="w-3.5 h-3.5 text-accent-lime" />
              </span>
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
};