fetch('http://localhost:3000/api/binance-proxy/ticker/24hr').then(r => console.log('STATUS:', r.status)).catch(e => console.error(e));
