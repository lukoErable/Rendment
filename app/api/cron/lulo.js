import axios from 'axios';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

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

async function updateDataInDatabase(symbol, values) {
  const connection = await pool.getConnection();
  try {
    const dateValue = getDateValue();
    for (const value of values) {
      let lendingRate = value.lending_rate;
      if (lendingRate === null || lendingRate === '0.00') {
        lendingRate = null;
      }

      let query;
      if (value.protocol === 'solend') {
        query = `INSERT INTO protocols (DATE, PROTOCOL, URL, BLOCKCHAIN, TYPE, ASSET, YIELD, AUM, DEPOSIT, WITHDRAW, TVL) VALUES (?, 'SOLEND', 'https://solend.fi/dashboard', 'SOLANA', 'LENDING', ?, ?, NULL, NULL, NULL, NULL)`;
      } else if (value.protocol === 'marginfi') {
        query = `INSERT INTO protocols (DATE, PROTOCOL, URL, BLOCKCHAIN, TYPE, ASSET, YIELD, AUM, DEPOSIT, WITHDRAW, TVL) VALUES (?, 'MARGINFI', 'https://app.marginfi.com', 'SOLANA', 'LENDING', ?, ?, NULL, NULL, NULL, NULL)`;
      } else if (value.protocol === 'drift') {
        query = `INSERT INTO protocols (DATE, PROTOCOL, URL, BLOCKCHAIN, TYPE, ASSET, YIELD, AUM, DEPOSIT, WITHDRAW, TVL) VALUES (?, 'DRIFT', 'https://app.drift.trade/earn', 'SOLANA', 'FARMING', ?, ?, NULL, NULL, NULL, NULL)`;
      }

      await connection.execute(query, [dateValue, symbol, lendingRate]);
    }

    console.log(
      `LULO: Les valeurs pour ${symbol} ont été mises à jour avec succès !`
    );
  } catch (error) {
    console.error(
      `LULO : Erreur lors de la mise à jour des valeurs pour ${symbol} :`,
      error
    );
    throw error;
  } finally {
    connection.release();
  }
}

const mintAddresses = {
  SOL: 'So11111111111111111111111111111111111111112',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  ETH: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  RNDR: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
};

const protocolFilter = {
  SOL: ['marginfi', 'solend', 'drift'],
  JUP: ['marginfi', 'solend', 'drift'],
  USDC: ['marginfi', 'solend', 'drift'],
  ETH: ['marginfi', 'solend', 'drift'],
  USDT: ['marginfi', 'solend', 'drift'],
  RNDR: ['marginfi', 'drift'],
  RAY: ['solend'],
  WIF: ['marginfi', 'drift'],
  BONK: ['marginfi'],
};

async function fetchAndUpdateData() {
  try {
    const response = await axios.get(
      'https://www.lulo.fi/api/protocols?cluster=mainnet&lookbackMinutes=1440&includeAll=false&includeIsolated=false'
    );
    const data = response.data.data;
    const lendingRates = {};

    data.forEach((protocol) => {
      for (const [key, mintAddress] of Object.entries(mintAddresses)) {
        if (
          protocol.mint_address === mintAddress &&
          protocolFilter[key].includes(protocol.protocol)
        ) {
          if (!lendingRates[key]) {
            lendingRates[key] = [];
          }
          lendingRates[key].push({
            protocol: protocol.protocol,
            lending_rate: `${parseFloat(protocol.lending_rate).toFixed(2)}`,
          });
        }
      }
    });

    for (const [key, value] of Object.entries(lendingRates)) {
      await updateDataInDatabase(key, value);
    }

    return { success: true, message: 'Data updated successfully' };
  } catch (error) {
    console.error('LULO : Error fetching or updating data:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.query.token !== process.env.CRON_SECRET_TOKEN) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const result = await fetchAndUpdateData();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
