import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

export function TypewriterText({ text, speed = 10, onComplete }: { text: string; speed?: number; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState('');
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let index = 0;
    setDisplayedText('');

    if (!text) return;

    const intervalId = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      index++;
      if (index === text.length) {
        clearInterval(intervalId);
        onCompleteRef.current?.();
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [text, speed]);

  return (
    <motion.p
        className="text-gray-300 leading-relaxed font-mono whitespace-pre-line text-sm mb-6 min-h-[4rem]"
    >
      {displayedText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        className="inline-block w-2 h-4 bg-amber-500 ml-1 align-middle"
      />
    </motion.p>
  );
}
