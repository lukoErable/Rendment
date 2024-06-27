'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Protocol } from '../api/queries/route';

export default function YieldOP() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);

  useEffect(() => {
    const fetchProtocols = async () => {
      try {
        const response = await fetch('/api/queries');
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
    <div className="flex justify-center items-center">
      <main className="w-full max-w-5xl p-4 h-screen">
        <table className="table-auto w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-white border-opacity-50 p-2">
                TOKEN
              </th>
              <th className="border border-white border-opacity-50 p-2">
                BLOCKCHAIN
              </th>
              <th className="border border-white border-opacity-50 p-2">
                YIELD
              </th>
              <th className="border border-white border-opacity-50 p-2">
                ACTION
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedProtocols.map((protocol, index) => (
              <tr key={index}>
                <td className="border border-white border-opacity-50 p-2 flex items-center">
                  <Image
                    src={getAssetLogo(protocol.ASSET)}
                    alt={formatAssetName(protocol.ASSET)}
                    className="mr-4 border-none"
                    width={25}
                    height={25}
                  />
                  {formatAssetName(protocol.ASSET).toUpperCase()}
                </td>
                <td className="border border-white border-opacity-50 p-2">
                  {protocol.BLOCKCHAIN.toUpperCase()}
                </td>
                <td className="border border-white border-opacity-50 p-2">
                  {protocol.YIELD + ' %'}
                </td>
                <td className="p-2 text-center border border-white border-opacity-50 hover:cursor-pointer hover:bg-white hover:bg-opacity-10">
                  <button className="">DEPOSIT</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
