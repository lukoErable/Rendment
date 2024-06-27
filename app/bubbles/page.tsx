'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Protocol } from '../db/api/queries/route';

export default function Bubbles() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);

  useEffect(() => {
    const fetchProtocols = async () => {
      try {
        const response = await fetch('db/api/queries');
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des protocoles');
        }
        const protocolsData: Protocol[] = await response.json();
        console.log('Résultats de la requête :', protocolsData);

        setProtocols(protocolsData);
      } catch (error) {
        console.error('Erreur lors de la récupération des protocoles :', error);
      }
    };

    fetchProtocols();
  }, []);

  useEffect(() => {
    const assets = document.querySelectorAll<HTMLDivElement>('.asset');
    const speeds = Array.from({ length: assets.length }, () => ({
      dx: (Math.random() - 0.5) * 4,
      dy: (Math.random() - 0.5) * 4,
    }));

    const moveAssets = () => {
      assets.forEach((asset, index) => {
        const rect = asset.getBoundingClientRect();

        let { left, top } = rect;
        let { dx, dy } = speeds[index];

        if (left + rect.width >= window.innerWidth || left <= 0) {
          dx = -dx;
        }

        if (top + rect.height >= window.innerHeight || top <= 0) {
          dy = -dy;
        }

        speeds[index] = { dx, dy };
        asset.style.left = `${left + dx}px`;
        asset.style.top = `${top + dy}px`;
      });

      requestAnimationFrame(moveAssets);
    };

    moveAssets();
  }, [protocols]);

  const sortedProtocols = [...protocols].sort(
    (a, b) => Number(b.YIELD) - Number(a.YIELD)
  );

  const formatAssetName = (asset: string) => {
    if (asset.toLowerCase().includes('sol')) return 'SOL';
    if (asset.toLowerCase().includes('eth')) return 'ETH';
    if (asset.toLowerCase().includes('usdc')) return 'USDC';
    if (asset.toLowerCase().includes('jup')) return 'JUP';
    return asset;
  };

  const ethLogo = 'https://app.mango.markets/icons/eth.svg';
  const solLogo = 'https://app.mango.markets/icons/sol.svg';
  const usdcLogo = 'https://app.mango.markets/icons/usdc.svg';
  const jupLogo = 'https://app.mango.markets/icons/jup.svg';
  const usdtLogo = 'https://app.mango.markets/icons/usdt.svg';
  const rayLogo = 'https://app.mango.markets/icons/ray.svg';
  const wifLogo = 'https://app.mango.markets/icons/wif.svg';
  const bonkLogo = 'https://app.mango.markets/icons/bonk.svg';
  const rndrLogo = 'https://app.mango.markets/icons/render.svg';

  const getAssetLogo = (asset: string) => {
    switch (formatAssetName(asset).toUpperCase()) {
      case 'ETH':
        return ethLogo;
      case 'SOL':
        return solLogo;
      case 'USDC':
        return usdcLogo;
      case 'JUP':
        return jupLogo;
      case 'USDT':
        return usdtLogo;
      case 'RAY':
        return rayLogo;
      case 'WIF':
        return wifLogo;
      case 'BONK':
        return bonkLogo;
      case 'RNDR':
        return rndrLogo;
      default:
        return '';
    }
  };

  return (
    <div className="relative w-full overflow-hidden h-screen">
      {sortedProtocols.map((protocol, index) => {
        const yieldValue = Number(protocol.YIELD);
        const logoSize = Math.max(yieldValue * 10, 20); // Set a minimum size to 20

        return (
          <div
            key={index}
            className="asset fixed flex flex-col items-center justify-center text-white"
            style={{
              width: `${logoSize}px`,
              height: `${logoSize}px`,
              left: `${Math.random() * (window.innerWidth - logoSize)}px`,
              top: `${Math.random() * (window.innerHeight - logoSize)}px`,
              zIndex: 20,
            }}
          >
            <Image
              src={getAssetLogo(protocol.ASSET)}
              alt={formatAssetName(protocol.ASSET)}
              width={logoSize}
              height={logoSize}
            />
            <span className="mt-1 text-xs">{yieldValue}%</span>
          </div>
        );
      })}
    </div>
  );
}
