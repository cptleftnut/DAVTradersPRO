const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

code = code.replace(
  `        <WalletSummaryWidget
          widgetOrder={widgetOrder}
          draggedIndex={draggedIndex}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDrop={handleDrop}
          handleDragEnd={handleDragEnd}
          moveWidget={moveWidget}
          walletData={walletData}
          walletLoading={walletLoading}
        />`,
  `        <WalletSummaryWidget
          widgetOrder={widgetOrder}
          draggedIndex={draggedIndex}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDrop={handleDrop}
          handleDragEnd={handleDragEnd}
          moveWidget={moveWidget}
          walletData={walletData}
          walletLoading={walletLoading}
          onOpenDeposit={() => {
             setP2PAmount(0); // Means the user specifies amount on Binance App, or we could ask for amount here. But let's pass 0, the modal can handle it or Binance App handles it.
             setP2pReference('DEPOSIT-FUNDS-' + new Date().getTime().toString().slice(-4));
             setShowP2PModal(true);
          }}
        />`
)

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
