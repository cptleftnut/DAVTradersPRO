const fs = require('fs');
let code = fs.readFileSync('src/components/FearAndGreedIndex.tsx', 'utf8');
code = code.replace(
`      } catch (err) {
        console.error('Failed to fetch fear and greed index', err);
      }`,
`      } catch (err: any) {
        if (String(err).includes('Failed to fetch')) return;
        console.error('Failed to fetch fear and greed index', err);
      }`
);
fs.writeFileSync('src/components/FearAndGreedIndex.tsx', code);
