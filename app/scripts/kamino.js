const axios = require('axios');
const { get } = require('http');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'rdmt.cd4yo8mao5nm.eu-north-1.rds.amazonaws.com',
  user: 'admin',
  password: 'rdmt_protocols667$$',
  database: 'rendment',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const getConnection = async () => {
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error('Error getting database connection:', error);
    throw error;
  }
};

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

const updateDataInDatabase = async (symbol, value, totalSupply) => {
  try {
    const connection = await getConnection();
    const dateValue = getDateValue();

    const query = `
    INSERT INTO protocols (DATE, PROTOCOL, URL, BLOCKCHAIN, TYPE, ASSET, YIELD, AUM, DEPOSIT, WITHDRAW, TVL)
    VALUES ('${dateValue}', 'KAMINO', 'https://app.kamino.finance', 'SOLANA', 'LENDING', '${symbol}', '${(
      value * 100
    ).toFixed(2)}', NULL, NULL, NULL, '${totalSupply}');`;

    await connection.execute(query);

    connection.release();

    console.log(
      `KAMINO: La valeur de ${symbol} a été mise à jour avec succès : ${(
        value * 100
      ).toFixed(2)} et supply : ${totalSupply}`
    );
  } catch (error) {
    console.error(
      `KAMINO : Erreur lors de la mise à jour de la valeur pour ${symbol} :`
    );
  }
};

async function getMarketData(Url, start, end, cryptoName) {
  const url = `${Url}/metrics/history?env=mainnet-beta&start=${start}&end=${end}`;
  const options = {
    headers: {},
    method: 'GET',
  };

  try {
    const response = await axios(url, options);
    const history = response.data.history;

    if (history.length > 0) {
      const latestRecord = history[history.length - 1];
      const { supplyInterestAPY } = latestRecord.metrics;
      const totalSupply = parseFloat(latestRecord.metrics.totalSupply);
      const supply = totalSupply.toFixed(2);
      updateDataInDatabase(cryptoName, supplyInterestAPY, supply);
    } else {
      console.log('KAMINO : No history data available.');
    }
  } catch (error) {
    console.error('KAMINO : Error fetching data:');
  }
}

const end = new Date()
  .toLocaleDateString('fr-FR', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  .split('/')
  .reverse()
  .join('-');
const startDate = new Date();
startDate.setDate(startDate.getDate() - 1);
const start = startDate
  .toLocaleDateString('fr-FR', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  .split('/')
  .reverse()
  .join('-');

getMarketData(
  'https://api.hubbleprotocol.io/kamino-market/DxXdAyU3kCjnyggvHmY5nAwg5cRbbmdyX3npfDMjjMek/reserves/Ga4rZytCpq1unD4DbEJ5bkHeUz9g3oh9AAFEi6vSauXp',
  start,
  end,
  'USDC'
); // USDC
getMarketData(
  'https://api.hubbleprotocol.io/kamino-market/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/reserves/d4A2prbA2whesmvHaL88BH6Ewn5N4bTSU2Ze8P6Bc4Q',
  start,
  end,
  'SOL'
); // Sol
getMarketData(
  'https://api.hubbleprotocol.io/kamino-market/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/reserves/febGYTnFX4GbSGoFHFeJXUHgNaK53fB23uDins9Jp1E',
  start,
  end,
  'ETH'
); // ETH
getMarketData(
  'https://api.hubbleprotocol.io/kamino-market/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/reserves/H3t6qZ1JkguCNTi9uzVKqQ7dvt2cum4XiXWom6Gn5e5S',
  start,
  end,
  'USDT'
); // USDT
getMarketData(
  'https://api.hubbleprotocol.io/kamino-market/ByYiZxp8QrdN9qbdtaAiePN8AAr3qvTPppNJDpf5DVJ5/reserves/GvPEtF7MsZceLbrrjprfcKN9quJ7EW221c4H9TVuWQUo',
  start,
  end,
  'WIF'
); // WIF
getMarketData(
  'https://api.hubbleprotocol.io/kamino-market/ByYiZxp8QrdN9qbdtaAiePN8AAr3qvTPppNJDpf5DVJ5/reserves/CoFdsnQeCUyJefhKK6GQaAPT9PEx8Xcs2jejtp9jgn38',
  start,
  end,
  'BONK'
); // BONK
getMarketData(
  'https://api.hubbleprotocol.io/kamino-market/ByYiZxp8QrdN9qbdtaAiePN8AAr3qvTPppNJDpf5DVJ5/reserves/3AKyRviT87dt9jP3RHpfFjxmSVNbR68Wx7UejnUyaSFH',
  start,
  end,
  'JUP'
); // JUP
