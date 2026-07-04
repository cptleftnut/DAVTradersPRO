const fs = require('fs');

const wrapMemo = (file) => {
    let code = fs.readFileSync(file, 'utf8');
    if (!code.includes('React.memo(')) {
        // e.g. export const PortfolioSummary = ({...}) => {
        // or export function PortfolioSummary({...}) {
        if (code.includes('export const PortfolioSummary =')) {
            code = code.replace('export const PortfolioSummary =', 'export const PortfolioSummary = React.memo(');
            code = code.replace(/};\s*$/, '});\n');
        } else if (code.includes('export function TickerTape()')) {
            code = code.replace('export function TickerTape() {', 'export const TickerTape = React.memo(function TickerTape() {');
            code = code.replace(/}\s*$/, '});\n');
        }
        fs.writeFileSync(file, code);
    }
}

try { wrapMemo('src/components/PortfolioSummary.tsx'); } catch(e){}
try { wrapMemo('src/components/TickerTape.tsx'); } catch(e){}

