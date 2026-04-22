import { useEffect, useRef, useState } from 'react';

export function usePullToRefresh(onRefresh, containerRef) {
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const THRESHOLD = 70;

  useEffect(() => {
    const el = containerRef?.current || document.querySelector('main');
    if (!el) return;

    const onTouchStart = (e) => {
      if (el.scrollTop === 0) startY.current = e.touches[0].clientY;
    };
    const onTouchEnd = async (e) => {
      if (startY.current === null) return;
      const delta = e.changedTouches[0].clientY - startY.current;
      startY.current = null;
      if (delta > THRESHOLD && !refreshing) {
        setRefreshing(true);
        await onRefresh();
        setRefreshing(false);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [onRefresh, refreshing, containerRef]);

  return refreshing;
}