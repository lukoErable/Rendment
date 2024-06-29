const axios = require('axios');
const mysql = require('mysql2/promise');

// Database configuration
const pool = mysql.createPool({
  host: 'rdmt.cd4yo8mao5nm.eu-north-1.rds.amazonaws.com',
  user: 'admin',
  password: 'rdmt_protocols667$$',
  database: 'rendment',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Get current date in YYYY-MM-DD format for France timezone
function getDateValue() {
  return new Date()
    .toLocaleString('fr-FR', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .split('/')
    .reverse()
    .join('-');
}

// Update data in the database
async function updateDataInDatabase(symbol, value, totalSupply) {
  let connection;
  try {
    connection = await pool.getConnection();
    const dateValue = getDateValue();

    const query = `
    INSERT INTO protocols (DATE, PROTOCOL, URL, BLOCKCHAIN, TYPE, ASSET, YIELD, AUM, DEPOSIT, WITHDRAW, TVL)
    VALUES (?, 'KAMINO', 'https://app.kamino.finance', 'SOLANA', 'LENDING', ?, ?, NULL, NULL, NULL, ?);`;

    await connection.execute(query, [
      dateValue,
      symbol,
      (value * 100).toFixed(2),
      totalSupply,
    ]);

    console.log(
      `KAMINO: Value for ${symbol} updated successfully: ${(
        value * 100
      ).toFixed(2)}% and supply: ${totalSupply}`
    );
  } catch (error) {
    console.error(`KAMINO: Error updating value for ${symbol}:`, error);
  } finally {
    if (connection) connection.release();
  }
}

// Fetch market data and update database
async function getMarketData(url, start, end, cryptoName) {
  try {
    const response = await axios.get(
      `${url}/metrics/history?env=mainnet-beta&start=${start}&end=${end}`
    );
    const history = response.data.history;

    if (history.length > 0) {
      const latestRecord = history[history.length - 1];
      const { supplyInterestAPY } = latestRecord.metrics;
      const totalSupply = parseFloat(latestRecord.metrics.totalSupply).toFixed(
        2
      );
      await updateDataInDatabase(cryptoName, supplyInterestAPY, totalSupply);
    } else {
      console.log('KAMINO: No history data available.');
    }
  } catch (error) {
    console.error('KAMINO: Error fetching data:', error);
  }
}

// Main function to update Kamino data
async function kamino(req, res) {
  const end = new Date().toISOString().split('T')[0];
  const start = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const markets = [
    {
      url: 'https://api.hubbleprotocol.io/kamino-market/DxXdAyU3kCjnyggvHmY5nAwg5cRbbmdyX3npfDMjjMek/reserves/Ga4rZytCpq1unD4DbEJ5bkHeUz9g3oh9AAFEi6vSauXp',
      crypto: 'USDC',
    },
    {
      url: 'https://api.hubbleprotocol.io/kamino-market/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/reserves/d4A2prbA2whesmvHaL88BH6Ewn5N4bTSU2Ze8P6Bc4Q',
      crypto: 'SOL',
    },
    {
      url: 'https://api.hubbleprotocol.io/kamino-market/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/reserves/febGYTnFX4GbSGoFHFeJXUHgNaK53fB23uDins9Jp1E',
      crypto: 'ETH',
    },
    {
      url: 'https://api.hubbleprotocol.io/kamino-market/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/reserves/H3t6qZ1JkguCNTi9uzVKqQ7dvt2cum4XiXWom6Gn5e5S',
      crypto: 'USDT',
    },
    {
      url: 'https://api.hubbleprotocol.io/kamino-market/ByYiZxp8QrdN9qbdtaAiePN8AAr3qvTPppNJDpf5DVJ5/reserves/GvPEtF7MsZceLbrrjprfcKN9quJ7EW221c4H9TVuWQUo',
      crypto: 'WIF',
    },
    {
      url: 'https://api.hubbleprotocol.io/kamino-market/ByYiZxp8QrdN9qbdtaAiePN8AAr3qvTPppNJDpf5DVJ5/reserves/CoFdsnQeCUyJefhKK6GQaAPT9PEx8Xcs2jejtp9jgn38',
      crypto: 'BONK',
    },
    {
      url: 'https://api.hubbleprotocol.io/kamino-market/ByYiZxp8QrdN9qbdtaAiePN8AAr3qvTPppNJDpf5DVJ5/reserves/3AKyRviT87dt9jP3RHpfFjxmSVNbR68Wx7UejnUyaSFH',
      crypto: 'JUP',
    },
  ];

  try {
    await Promise.all(
      markets.map((market) =>
        getMarketData(market.url, start, end, market.crypto)
      )
    );

    if (res) {
      res.status(200).json({ message: 'Kamino data updated successfully' });
    } else {
      console.log('Kamino data updated successfully');
    }
  } catch (error) {
    console.error('Error updating Kamino data:', error);
    if (res) {
      res
        .status(500)
        .json({
          message: 'Error updating Kamino data',
          error: error.toString(),
        });
    } else {
      throw error;
    }
  }
}

// Execute the kamino function
kamino().catch(console.error);
