import { useEffect, useRef, useState } from 'react';

const ITEM_HEIGHT = 320;
const REPEAT = 4;

export default function Reel({ items, spinToken, onSettle, renderItem }) {
  const trackRef = useRef(null);
  const [strip, setStrip] = useState([]);
  const [targetIndex, setTargetIndex] = useState(null);

  useEffect(() => {
    if (spinToken === 0 || !items.length) return;

    const chosen = Math.floor(Math.random() * items.length);
    const loops = REPEAT;
    const built = [];
    for (let l = 0; l < loops; l++) {
      for (let i = 0; i < items.length; i++) built.push(items[i]);
    }
    // final landing item appended at the end
    built.push(items[chosen]);
    const finalIndex = built.length - 1;

    setStrip(built);
    setTargetIndex(finalIndex);

    const track = trackRef.current;
    if (!track) return;

    track.style.transition = 'none';
    track.style.transform = 'translateY(0px)';

    // force reflow so the browser registers the reset before animating
    // eslint-disable-next-line no-unused-expressions
    track.offsetHeight;

    requestAnimationFrame(() => {
      track.style.transition = 'transform 3.2s cubic-bezier(0.12, 0.75, 0.15, 1)';
      track.style.transform = `translateY(-${finalIndex * ITEM_HEIGHT}px)`;
    });

    const timeout = setTimeout(() => {
      onSettle(items[chosen]);
    }, 3300);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinToken, items]);

  return (
    <div className="reel">
      <div className="reel-track" ref={trackRef}>
        {strip.map((item, idx) => (
          <div className="reel-item" key={idx}>
            {renderItem(item)}
          </div>
        ))}
      </div>
      <div className="reel-pointer">▶</div>
    </div>
  );
}
