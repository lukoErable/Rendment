'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Protocol } from '../db/api/queries/route';

export default function YieldOP() {
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

  const Logos = {
    driftLogo: 'https://www.lulo.fi/protocols/drift.png',
    kaminoLogo: 'https://www.lulo.fi/protocols/kamino.png',
    marginfiLogo: 'https://www.lulo.fi/protocols/marginfi.png',
    mangoLogo: 'https://www.lulo.fi/protocols/mango.png',
    raydiumLogo: 'https://app.mango.markets/icons/ray.svg',
    meteoraLogo: 'https://www.meteora.ag/logo.svg',
    sanctumLogo: 'https://app.sanctum.so/favicon.ico',
    solendLogo: 'https://www.lulo.fi/protocols/solend.png',
  };

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
    <div className="flex flex-col justify-center items-center p-4">
      <Image src={'/logo.png'} alt="rdmt" width={300} height={100} />
      <p className="mt-4">
        Your automated gateway to superior yields on assets
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {sortedProtocols.map((protocol, index) => {
          const yieldValue = Number(protocol.YIELD);
          const logoSize = 50;

          return (
            <div key={index} className="flex flex-row items-center p-4">
              <Image
                src={getAssetLogo(protocol.ASSET)}
                alt={formatAssetName(protocol.ASSET)}
                width={logoSize}
                height={logoSize}
              />
              <span className="ml-2 text-center text-sm font-medium">
                {yieldValue}%
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col text-center">
        <p className="flex text-center m-auto border-b w-full align-middle pt-8">
          d-Apps
        </p>
        <div className="flex">
          {Object.entries(Logos).map(([key, logoUrl], index) => (
            <div key={index} className="flex flex-row items-center p-4">
              <Image
                src={logoUrl}
                alt={key.replace('Logo', '')}
                width={50}
                height={50}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
