import { NextResponse } from 'next/server';
import { getConnection } from '../db/route';

export interface Protocol {
  blockchain: string;
  type: string;
  sol: string;
  usdc: string;
  jup: string;
  eth: string;
  url: string;
  ID: number;
  DATE: string;
  PROTOCOL: string;
  URL: string;
  BLOCKCHAIN: string;
  TYPE: string;
  ASSET: string;
  YIELD: number;
  AUM: number | null;
  DEPOSIT: number | null;
  WITHDRAW: number | null;
  TVL: number | null;
}

function getDateValue() {
  const franceTime = new Date().toLocaleDateString('fr-FR', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const [day, month, year] = franceTime.split('/');
  return `${year}-${month}-${day}`;
}

export const GET = async (request: Request) => {
  try {
    const currentDate = getDateValue();
    const connection = await getConnection();
    const [rows, fields] = await connection.execute(`
    WITH AssetGroups AS (
      SELECT
          DATE,
          CASE
              WHEN ASSET IN ('INF', 'HSOL', 'JITOSOL', 'JPSOL', 'MSOL', 'BONKSOL') THEN 'SOL'
              WHEN ASSET IN ('compound-mainnet-eth', 'conic-eth', 'conic-usdc') THEN 'ETH'
              ELSE ASSET
          END AS AssetGroup,
          ASSET,
          YIELD AS MaxYield,
          BLOCKCHAIN
      FROM protocols
  ),
  MaxYields AS (
      SELECT
          DATE,
          AssetGroup,
          BLOCKCHAIN,
          MAX(MaxYield) AS MaxYield
      FROM AssetGroups
      WHERE AssetGroup != 'ETH' -- Exclude ETH from this selection
      GROUP BY DATE, AssetGroup, BLOCKCHAIN
  ),
  MaxETHYieldPerBlockchain AS (
      SELECT
          DATE,
          'ETH' AS AssetGroup,
          BLOCKCHAIN,
          MAX(MaxYield) AS MaxYield
      FROM AssetGroups
      WHERE AssetGroup = 'ETH'
      GROUP BY DATE, BLOCKCHAIN
  ),
  BestETHYield AS (
      SELECT
          DATE,
          'ETH' AS AssetGroup,
          MAX(MaxYield) AS MaxYield
      FROM MaxETHYieldPerBlockchain
      GROUP BY DATE
  )
  SELECT
      my.DATE,
      my.AssetGroup AS ASSET,
      my.MaxYield AS YIELD,
      my.BLOCKCHAIN
  FROM MaxYields my
  UNION ALL
  SELECT
      be.DATE,
      'ETH' AS ASSET,
      be.MaxYield AS YIELD,
      me.BLOCKCHAIN
  FROM BestETHYield be
  JOIN MaxETHYieldPerBlockchain me ON be.DATE = me.DATE AND be.MaxYield = me.MaxYield
  ORDER BY DATE, ASSET, BLOCKCHAIN;
  
  
    `);
    console.log(rows, fields);

    connection.release();
    return new NextResponse(JSON.stringify(rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse(
      JSON.stringify({ message: 'An error occurred', error: error }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
