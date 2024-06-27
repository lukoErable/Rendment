'use client';

import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Protocol } from '../api/queries/route';

Chart.register(...registerables);

export default function YieldOP() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([
    'SOL',
    'ETH',
    'JUP',
    'USDC_ETH',
    'USDC_SOL',
    'USDT',
    'WIF',
    'BONK',
    'RNDR',
    'RAY',
  ]);

  useEffect(() => {
    const fetchProtocols = async () => {
      try {
        const response = await fetch('/api/query_yield');
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

  const formatAssetName = (asset: string, blockchain: string) => {
    if (asset.toLowerCase().includes('sol')) return 'SOL';
    if (asset.toLowerCase().includes('usdt')) return 'USDT';
    if (asset.toLowerCase().includes('ray')) return 'RAY';
    if (asset.toLowerCase().includes('wif')) return 'WIF';
    if (asset.toLowerCase().includes('bonk')) return 'BONK';
    if (asset.toLowerCase().includes('rndr')) return 'RNDR';
    if (
      asset.toLowerCase().includes('eth') ||
      asset.toLowerCase().includes('conic-eth')
    )
      return 'ETH';
    if (asset.toLowerCase().includes('usdc')) {
      return blockchain.toLowerCase() === 'etherum' ? 'USDC_ETH' : 'USDC_SOL';
    }
    if (asset.toLowerCase().includes('jup')) return 'JUP';
    return asset;
  };

  const getColor = (asset: string) => {
    switch (asset) {
      case 'SOL':
        return 'rgba(255, 99, 132, 1)';
      case 'USDT':
        return 'rgba(0, 234, 132, 1)';
      case 'ETH':
        return 'rgba(54, 162, 235, 1)';
      case 'USDC_ETH':
        return 'rgba(75, 192, 192, 1)';
      case 'USDC_SOL':
        return 'rgba(255, 159, 64, 1)';
      case 'JUP':
        return 'rgba(153, 102, 255, 1)';
      case 'RAY':
        return 'rgba(255, 206, 86, 1)';
      case 'WIF':
        return 'rgba(75, 192, 192, 1)';
      case 'BONK':
        return 'rgba(153, 102, 255, 1)';
      case 'RNDR':
        return 'rgba(255, 206, 86, 1)';

      default:
        return 'rgba(201, 203, 207, 1)';
    }
  };

  const filteredProtocols = protocols.filter((protocol) =>
    selectedAssets.includes(
      formatAssetName(protocol.ASSET, protocol.BLOCKCHAIN)
    )
  );

  const data = {
    labels: Array.from(
      new Set(filteredProtocols.map((protocol) => new Date(protocol.DATE)))
    ),
    datasets: selectedAssets.map((asset) => {
      return {
        label: asset,
        data: filteredProtocols
          .filter(
            (protocol) =>
              formatAssetName(protocol.ASSET, protocol.BLOCKCHAIN) === asset
          )
          .map((protocol) => ({
            x: new Date(protocol.DATE),
            y: protocol.YIELD,
          })),
        fill: false,
        borderColor: getColor(asset),
        tension: 0.1,
      };
    }),
  };

  const options = {
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'day' as const,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: number | string) {
            return (value + '%') as string;
          },
        },
      },
    },
  };

  return (
    <div className="flex flex-col items-center">
      <main className="w-full max-w-5xl p-4 h-screen">
        <Line data={data} options={options} />
      </main>
    </div>
  );
}
