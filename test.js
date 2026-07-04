fetch("https://api.binance.com/api/v3/ticker/24hr").then(r => r.text()).then(t => console.log(t.substring(0,200)));
