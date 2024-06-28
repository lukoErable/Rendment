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

async function updateDatabase(
  protocol,
  symbol,
  yieldValue,
  tvl = null,
  type = 'LENDING',
  url = null
) {
  const connection = await pool.getConnection();
  try {
    const dateValue = getDateValue();
    const query = `
    INSERT INTO protocols (DATE, PROTOCOL, URL, BLOCKCHAIN, TYPE, ASSET, YIELD, AUM, DEPOSIT, WITHDRAW, TVL)
    VALUES (?, ?, ?, 'SOLANA', ?, ?, ?, NULL, NULL, NULL, ?);`;

    await connection.execute(query, [
      dateValue,
      protocol,
      url,
      type,
      symbol,
      yieldValue,
      tvl,
    ]);

    console.log(
      `${protocol}: La valeur de ${symbol} a été mise à jour avec succès : ${yieldValue}`
    );
  } catch (error) {
    console.error(
      `${protocol} : Erreur lors de la mise à jour de la valeur pour ${symbol} :`,
      error
    );
    throw error;
  } finally {
    connection.release();
  }
}

// Kamino
async function fetchKaminoData() {
  const kaminoUrls = {
    USDC: 'https://api.hubbleprotocol.io/kamino-market/DxXdAyU3kCjnyggvHmY5nAwg5cRbbmdyX3npfDMjjMek/reserves/Ga4rZytCpq1unD4DbEJ5bkHeUz9g3oh9AAFEi6vSauXp',
    SOL: 'https://api.hubbleprotocol.io/kamino-market/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/reserves/d4A2prbA2whesmvHaL88BH6Ewn5N4bTSU2Ze8P6Bc4Q',
    ETH: 'https://api.hubbleprotocol.io/kamino-market/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/reserves/febGYTnFX4GbSGoFHFeJXUHgNaK53fB23uDins9Jp1E',
    USDT: 'https://api.hubbleprotocol.io/kamino-market/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/reserves/H3t6qZ1JkguCNTi9uzVKqQ7dvt2cum4XiXWom6Gn5e5S',
    WIF: 'https://api.hubbleprotocol.io/kamino-market/ByYiZxp8QrdN9qbdtaAiePN8AAr3qvTPppNJDpf5DVJ5/reserves/GvPEtF7MsZceLbrrjprfcKN9quJ7EW221c4H9TVuWQUo',
    BONK: 'https://api.hubbleprotocol.io/kamino-market/ByYiZxp8QrdN9qbdtaAiePN8AAr3qvTPppNJDpf5DVJ5/reserves/CoFdsnQeCUyJefhKK6GQaAPT9PEx8Xcs2jejtp9jgn38',
    JUP: 'https://api.hubbleprotocol.io/kamino-market/ByYiZxp8QrdN9qbdtaAiePN8AAr3qvTPppNJDpf5DVJ5/reserves/3AKyRviT87dt9jP3RHpfFjxmSVNbR68Wx7UejnUyaSFH',
  };

  const end = new Date().toISOString().split('T')[0];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 1);
  const start = startDate.toISOString().split('T')[0];

  for (const [symbol, url] of Object.entries(kaminoUrls)) {
    try {
      const response = await axios.get(
        `${url}/metrics/history?env=mainnet-beta&start=${start}&end=${end}`
      );
      const history = response.data.history;

      if (history.length > 0) {
        const latestRecord = history[history.length - 1];
        const { supplyInterestAPY } = latestRecord.metrics;
        const totalSupply = parseFloat(latestRecord.metrics.totalSupply);
        const supply = totalSupply.toFixed(2);
        await updateDatabase(
          'KAMINO',
          symbol,
          (supplyInterestAPY * 100).toFixed(2),
          supply,
          'LENDING',
          'https://app.kamino.finance'
        );
      }
    } catch (error) {
      console.error(`KAMINO : Error fetching data for ${symbol}:`, error);
    }
  }
}

// Lulo
async function fetchLuloData() {
  const luloUrl =
    'https://www.lulo.fi/api/protocols?cluster=mainnet&lookbackMinutes=1440&includeAll=false&includeIsolated=false';
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

  try {
    const response = await axios.get(luloUrl);
    const data = response.data.data;

    for (const [key, mintAddress] of Object.entries(mintAddresses)) {
      for (const protocol of protocolFilter[key]) {
        const protocolData = data.find(
          (p) => p.mint_address === mintAddress && p.protocol === protocol
        );
        if (protocolData) {
          const lendingRate = parseFloat(protocolData.lending_rate).toFixed(2);
          let protocolName, url, type;
          switch (protocol) {
            case 'solend':
              protocolName = 'SOLEND';
              url = 'https://solend.fi/dashboard';
              type = 'LENDING';
              break;
            case 'marginfi':
              protocolName = 'MARGINFI';
              url = 'https://app.marginfi.com';
              type = 'LENDING';
              break;
            case 'drift':
              protocolName = 'DRIFT';
              url = 'https://app.drift.trade/earn';
              type = 'FARMING';
              break;
          }
          await updateDatabase(protocolName, key, lendingRate, null, type, url);
        }
      }
    }
  } catch (error) {
    console.error('LULO : Error fetching or updating data:', error);
  }
}

// Mango
async function fetchMangoData() {
  const mangoUrls = {
    USDC: 'https://api.mngo.cloud/data/v4/token-historical-stats?mango-group=78b8f4cGCwmZ9ysPFMWLaLTkkaYnUjwMJYStWe5RTSSX&mint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    SOL: 'https://api.mngo.cloud/data/v4/token-historical-stats?mango-group=78b8f4cGCwmZ9ysPFMWLaLTkkaYnUjwMJYStWe5RTSSX&mint=So11111111111111111111111111111111111111112',
    JUP: 'https://api.mngo.cloud/data/v4/token-historical-stats?mango-group=78b8f4cGCwmZ9ysPFMWLaLTkkaYnUjwMJYStWe5RTSSX&mint=JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    ETH: 'https://api.mngo.cloud/data/v4/token-historical-stats?mango-group=78b8f4cGCwmZ9ysPFMWLaLTkkaYnUjwMJYStWe5RTSSX&mint=7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
    USDT: 'https://api.mngo.cloud/data/v4/token-historical-stats?mango-group=78b8f4cGCwmZ9ysPFMWLaLTkkaYnUjwMJYStWe5RTSSX&mint=Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    RAY: 'https://api.mngo.cloud/data/v4/token-historical-stats?mango-group=78b8f4cGCwmZ9ysPFMWLaLTkkaYnUjwMJYStWe5RTSSX&mint=4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    WIF: 'https://api.mngo.cloud/data/v4/token-historical-stats?mango-group=78b8f4cGCwmZ9ysPFMWLaLTkkaYnUjwMJYStWe5RTSSX&mint=EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    BONK: 'https://api.mngo.cloud/data/v4/token-historical-stats?mango-group=78b8f4cGCwmZ9ysPFMWLaLTkkaYnUjwMJYStWe5RTSSX&mint=DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    RNDR: 'https://api.mngo.cloud/data/v4/token-historical-stats?mango-group=78b8f4cGCwmZ9ysPFMWLaLTkkaYnUjwMJYStWe5RTSSX&mint=rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',
  };

  for (const [symbol, url] of Object.entries(mangoUrls)) {
    try {
      const response = await axios.get(url);
      const data = response.data;

      if (Array.isArray(data) && data.length > 0) {
        const firstRecord = data[0].deposit_apr;
        const lendingRate = (firstRecord * 100).toFixed(2);
        await updateDatabase(
          'MANGO',
          symbol,
          lendingRate,
          null,
          'LENDING',
          'https://app.mango.markets/'
        );
      }
    } catch (error) {
      console.error(`MANGO : Error fetching data for ${symbol}:`, error);
    }
  }
}

// Meteora
async function fetchMeteoraData() {
  const meteoraUrl = 'https://app.meteora.ag/vault/vault_info';
  try {
    const response = await axios.get(meteoraUrl);
    const data = response.data;

    const tokensToProcess = ['USDC', 'USDT', 'SOL'];
    for (const tokenSymbol of tokensToProcess) {
      const tokenData = data.find((item) => item.symbol === tokenSymbol);
      if (tokenData) {
        const { closest_apy: yieldValue, token_amount: TVL } = tokenData;
        await updateDatabase(
          'METEORA',
          tokenSymbol,
          yieldValue,
          TVL,
          'FARMING',
          'https://app.meteora.ag/vaults'
        );
      }
    }
  } catch (error) {
    console.error(`METEORA : Error fetching data:`, error);
  }
}

// Raydium
async function fetchRaydiumData() {
  const raydiumUrl = 'https://api-v3.raydium.io/main/stake-pools';
  try {
    const response = await axios.get(raydiumUrl);
    const data = response.data.data.data;

    if (data.length > 0) {
      const firstRecord = data[0].apr;
      const lendingRate = (firstRecord * 100).toFixed(2);
      const TVL = data[0].tvl;
      await updateDatabase(
        'RAYDIUM',
        'RAY',
        lendingRate,
        TVL,
        'STAKING',
        'https://raydium.io/staking/'
      );
    } else {
      console.log('RAYDIUM : No data available.');
    }
  } catch (error) {
    console.error('RAYDIUM : Error fetching data:', error);
  }
}

// Sanctum
async function fetchSanctumData() {
  const sanctumUrl = 'https://sanctum-extra-api.ngrok.dev/v1/apy/latest';
  const options = {
    headers: {
      accept: '*/*',
      'accept-language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,ru;q=0.6',
      priority: 'u=1, i',
      'sec-ch-ua':
        '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'cross-site',
    },
    method: 'GET',
  };

  const crypto = {
    J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn: 'JITOSOL',
    BonK1YhkXEGLZzwtcvRTip3gAL9nCeQD7ppZBLXhtTs: 'BONKSOL',
    jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v: 'JPSOL',
    mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So: 'MSOL',
    '5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm': 'INF',
    he1iusmfkpAdwvxLNGV8Y1iSbj4rUy6yMhEA3fotn9A: 'HSOL',
  };

  const lstParams = Object.keys(crypto)
    .map((key) => `lst=${key}`)
    .join('&');
  const fullUrl = `${sanctumUrl}?${lstParams}`;

  try {
    const response = await axios(fullUrl, options);
    for (const [key, value] of Object.entries(crypto)) {
      const apy = response.data.apys[key];
      if (apy !== undefined) {
        await updateDatabase(
          'SANCTUM',
          value,
          (apy * 100).toFixed(2),
          null,
          'STAKING',
          'https://app.sanctum.so/lsts'
        );
      } else {
        console.log(`SANCTUM : No data available for ${value}.`);
      }
    }
  } catch (error) {
    console.error('SANCTUM : Error fetching data:', error);
  }
}

// Main function to run all fetches
async function fetchAllData() {
  try {
    await Promise.all([
      fetchKaminoData(),
      fetchLuloData(),
      fetchMangoData(),
      fetchMeteoraData(),
      fetchRaydiumData(),
      fetchSanctumData(),
    ]);
    return {
      success: true,
      message: 'All data fetched and updated successfully',
    };
  } catch (error) {
    console.error('Error fetching and updating data:', error);
    return {
      success: false,
      message: 'Error fetching and updating data',
      error: error.toString(),
    };
  }
}

// API route handler
export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const result = await fetchAllData();
      res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      console.error('Error in API route:', error);
      res
        .status(500)
        .json({
          success: false,
          message: 'Internal server error',
          error: error.toString(),
        });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
