'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

const DASHBOARD_PATHS = ['/admin', '/inventory_manager', '/lab_Assistant'];

export default function LenisScroll() {
    const pathname = usePathname();

    const disableLenis = DASHBOARD_PATHS.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`),
    );

    useEffect(() => {
        if (disableLenis) {
            return;
        }

        const lenis = new Lenis({
            duration: 1.2,
            smoothWheel: true,
            smoothTouch: false,
            anchors: true,
        });

        let rafId;
        const raf = (time) => {
            lenis.raf(time);
            rafId = requestAnimationFrame(raf);
        };

        rafId = requestAnimationFrame(raf);

        return () => {
            cancelAnimationFrame(rafId);
            lenis.destroy();
        };
    }, [disableLenis]);

    return null;
}
