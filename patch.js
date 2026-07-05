const fs = require('fs');
let code = fs.readFileSync('src/components/BinanceTradingPanel.tsx', 'utf8');

code = code.replace(
  `        <UpgradesStoreWidget userEmail={googleUser?.email}
          widgetOrder={widgetOrder}
          draggedIndex={draggedIndex}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDrop={handleDrop}
          handleDragEnd={handleDragEnd}
          moveWidget={moveWidget}
          onOpenProModal={() => setShowProModal(true)}
        />`,
  `        <UpgradesStoreWidget userEmail={googleUser?.email}
          widgetOrder={widgetOrder}
          draggedIndex={draggedIndex}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDrop={handleDrop}
          handleDragEnd={handleDragEnd}
          moveWidget={moveWidget}
          onOpenProModal={() => setShowProModal(true)}
          onOpenPayment={(amount: number, item: string) => {
             setP2PAmount(amount);
             setP2pReference(\`BUY-\${item.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase()}-\${new Date().getTime().toString().slice(-4)}\`);
             setShowP2PModal(true);
          }}
        />`
)

fs.writeFileSync('src/components/BinanceTradingPanel.tsx', code);
