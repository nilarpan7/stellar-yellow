import React, { useEffect, useRef } from "react";
import gsap from "gsap";

export function CustomCursor() {
    const cursorRef = useRef<HTMLDivElement>(null);
    const dotRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const cursor = cursorRef.current;
        const dot = dotRef.current;

        const onMouseMove = (e: MouseEvent) => {
            gsap.to(cursor, {
                x: e.clientX - 16,
                y: e.clientY - 16,
                duration: 0.15,
                ease: "power2.out",
            });
            gsap.to(dot, {
                x: e.clientX - 4,
                y: e.clientY - 4,
                duration: 0.05,
            });
        };

        const onMouseDown = () => {
            gsap.to(cursor, { scale: 0.8, duration: 0.2 });
        };

        const onMouseUp = () => {
            gsap.to(cursor, { scale: 1, duration: 0.2 });
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mousedown", onMouseDown);
        window.addEventListener("mouseup", onMouseUp);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mousedown", onMouseDown);
            window.removeEventListener("mouseup", onMouseUp);
        };
    }, []);

    return (
        <>
            <div
                ref={cursorRef}
                className="fixed top-0 left-0 w-8 h-8 border-2 border-lime-400 rounded-none pointer-events-none z-[9999] mix-blend-difference hidden md:block"
            />
            <div
                ref={dotRef}
                className="fixed top-0 left-0 w-2 h-2 bg-lime-400 rounded-none pointer-events-none z-[9999] mix-blend-difference hidden md:block"
            />
        </>
    );
}

export function BrutalistBackground() {
    return (
        <div className="fixed inset-0 pointer-events-none z-[-1] bg-zinc-950 overflow-hidden">
            {/* Grid Pattern */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255, 255, 255, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 1) 1px, transparent 1px)`,
                    backgroundSize: "40px 40px",
                }}
            />
            {/* Noise Overlay */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />
        </div>
    );
}

export function Marquee() {
    return (
        <div className="w-full bg-lime-400 py-4 border-y border-black overflow-hidden flex whitespace-nowrap z-10 relative">
            <div className="animate-[marquee_20s_linear_infinite] flex items-center gap-8 px-4 font-mono font-bold text-black text-xl uppercase tracking-widest">
                {Array.from({ length: 10 }).map((_, i) => (
                    <React.Fragment key={i}>
                        <span>Stellar Network</span>
                        <span>//</span>
                        <span>Decentralized</span>
                        <span>//</span>
                        <span>Soroban Smart Contracts</span>
                        <span>//</span>
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}
