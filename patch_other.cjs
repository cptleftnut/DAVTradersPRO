const fs = require('fs');

function patchFile(file, search, replace) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(search, replace);
  fs.writeFileSync(file, code);
}

patchFile('src/components/PortfolioSummary.tsx', 
`      } catch (e) {
        console.error("Failed to fetch wallet", e);
      }`, 
`      } catch (e: any) {
        if (String(e).includes('Failed to fetch')) return;
        console.error("Failed to fetch wallet", e);
      }`
);

patchFile('src/components/TradeHistory.tsx',
`    } catch (error) {
      console.error("Failed to fetch trades:", error);
    }`,
`    } catch (error: any) {
      if (String(error).includes('Failed to fetch')) return;
      console.error("Failed to fetch trades:", error);
    }`
);

patchFile('src/components/DemoWalletSection.tsx',
`    } catch (error) {
      console.error("Failed to fetch demo wallet:", error);
    }`,
`    } catch (error: any) {
      if (String(error).includes('Failed to fetch')) return;
      console.error("Failed to fetch demo wallet:", error);
    }`
);

patchFile('src/components/CryptoScreener.tsx',
`      } catch (err) {
        console.error("Failed to fetch screener data:", err);
      }`,
`      } catch (err: any) {
        if (String(err).includes('Failed to fetch')) return;
        console.error("Failed to fetch screener data:", err);
      }`
);
