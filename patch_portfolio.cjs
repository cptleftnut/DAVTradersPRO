const fs = require('fs');
let content = fs.readFileSync('src/components/PortfolioDistribution.tsx', 'utf8');

content = content.replace(
  `export function PortfolioDistribution({ walletData, currentPrice, activeSymbol }: PortfolioDistributionProps) {`,
  `export function PortfolioDistribution({ walletData, currentPrice = "1.0", activeSymbol = "BTCUSDT" }: Partial<PortfolioDistributionProps>) {`
);
fs.writeFileSync('src/components/PortfolioDistribution.tsx', content);
