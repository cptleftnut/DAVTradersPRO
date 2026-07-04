fetch('http://localhost:3000/api/binance-proxy/ticker/24hr').then(r => r.json()).then(d => console.log('DATA LENGTH:', d.length)).catch(e => console.error(e));
