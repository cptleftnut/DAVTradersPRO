const { performance } = require('perf_hooks');

// Mock fetch with artificial delay
global.fetch = async (url) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                ok: true,
                json: async () => ({ price: "50000" })
            });
        }, 100); // 100ms delay per request
    });
};

const assets = [
    { asset: "BTC", free: "1", locked: "0" },
    { asset: "ETH", free: "10", locked: "0" },
    { asset: "SOL", free: "100", locked: "0" },
    { asset: "ADA", free: "1000", locked: "0" },
    { asset: "DOT", free: "500", locked: "0" }
];

async function sequentialFetch() {
    let totalTime = 0;
    const start = performance.now();
    for (const s of assets) {
        if (s.asset !== "USDT" && s.asset !== "USDC") {
            try {
                const pRes = await fetch(`/api/binance-proxy/ticker/price?symbol=${s.asset}USDT`);
                if (pRes.ok) {
                    const json = await pRes.json();
                    const price = parseFloat(json.price);
                }
            } catch (e) {}
        }
    }
    const end = performance.now();
    return end - start;
}

async function concurrentFetch() {
    const start = performance.now();

    const fetchPromises = assets.map(async (s) => {
        let price = 1;
        if (s.asset !== "USDT" && s.asset !== "USDC") {
            try {
                const pRes = await fetch(`/api/binance-proxy/ticker/price?symbol=${s.asset}USDT`);
                if (pRes.ok) {
                    const json = await pRes.json();
                    price = parseFloat(json.price);
                }
            } catch (e) {}
        }
        return price;
    });

    await Promise.all(fetchPromises);

    const end = performance.now();
    return end - start;
}

async function runBenchmark() {
    console.log("Running Sequential Fetch Benchmark...");
    const seqTime = await sequentialFetch();
    console.log(`Sequential Fetch Time: ${seqTime.toFixed(2)} ms`);

    console.log("Running Concurrent Fetch Benchmark...");
    const conTime = await concurrentFetch();
    console.log(`Concurrent Fetch Time: ${conTime.toFixed(2)} ms`);

    const improvement = seqTime / conTime;
    console.log(`Concurrent fetch is ${improvement.toFixed(2)}x faster.`);
}

runBenchmark();
