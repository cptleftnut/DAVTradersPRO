fetch('https://api.binance.com/api/v3/ticker/24hr').then(r => console.log('STATUS:', r.status)).catch(e => console.error(e));
