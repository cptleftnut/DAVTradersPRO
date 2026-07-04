export function speakTradeAction(side: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const word = side.toUpperCase() === 'SELL' ? 'Sell' : 'Buying';
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'en-US';
  utterance.rate = 1.0;
  window.speechSynthesis.speak(utterance);
}
