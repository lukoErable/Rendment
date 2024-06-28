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

async function updateDataInDatabase(symbol, value, totalSupply) {
  const connection = await pool.getConnection();
  try {
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
      `KAMINO: La valeur de ${symbol} a été mise à jour avec succès : ${(
        value * 100
      ).toFixed(2)} et supply : ${totalSupply}`
    );
  } catch (error) {
    console.error(
      `KAMINO : Erreur lors de la mise à jour de la valeur pour ${symbol} :`,
      error
    );
  } finally {
    connection.release();
  }
}

async function getMarketData(Url, start, end, cryptoName) {
  const url = `${Url}/metrics/history?env=mainnet-beta&start=${start}&end=${end}`;

  try {
    const response = await axios.get(url);
    const history = response.data.history;

    if (history.length > 0) {
      const latestRecord = history[history.length - 1];
      const { supplyInterestAPY } = latestRecord.metrics;
      const totalSupply = parseFloat(latestRecord.metrics.totalSupply);
      const supply = totalSupply.toFixed(2);
      await updateDataInDatabase(cryptoName, supplyInterestAPY, supply);
    } else {
      console.log('KAMINO : No history data available.');
    }
  } catch (error) {
    console.error('KAMINO : Error fetching data:', error);
  }
}

export default async function handler(req, res) {
  if (req.query.token !== process.env.CRON_SECRET_TOKEN) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const end = new Date().toISOString().split('T')[0];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 1);
  const start = startDate.toISOString().split('T')[0];

  try {
    await Promise.all([
      getMarketData(
        'https://api.hubbleprotocol.io/kamino-market/DxXdAyU3kCjnyggvHmY5nAwg5cRbbmdyX3npfDMjjMek/reserves/Ga4rZytCpq1unD4DbEJ5bkHeUz9g3oh9AAFEi6vSauXp',
        start,
        end,
        'USDC'
      ),
      getMarketData(
        'https://api.hubbleprotocol.io/kamino-market/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/reserves/d4A2prbA2whesmvHaL88BH6Ewn5N4bTSU2Ze8P6Bc4Q',
        start,
        end,
        'SOL'
      ),
      getMarketData(
        'https://api.hubbleprotocol.io/kamino-market/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/reserves/febGYTnFX4GbSGoFHFeJXUHgNaK53fB23uDins9Jp1E',
        start,
        end,
        'ETH'
      ),
      getMarketData(
        'https://api.hubbleprotocol.io/kamino-market/7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF/reserves/H3t6qZ1JkguCNTi9uzVKqQ7dvt2cum4XiXWom6Gn5e5S',
        start,
        end,
        'USDT'
      ),
      getMarketData(
        'https://api.hubbleprotocol.io/kamino-market/ByYiZxp8QrdN9qbdtaAiePN8AAr3qvTPppNJDpf5DVJ5/reserves/GvPEtF7MsZceLbrrjprfcKN9quJ7EW221c4H9TVuWQUo',
        start,
        end,
        'WIF'
      ),
      getMarketData(
        'https://api.hubbleprotocol.io/kamino-market/ByYiZxp8QrdN9qbdtaAiePN8AAr3qvTPppNJDpf5DVJ5/reserves/CoFdsnQeCUyJefhKK6GQaAPT9PEx8Xcs2jejtp9jgn38',
        start,
        end,
        'BONK'
      ),
      getMarketData(
        'https://api.hubbleprotocol.io/kamino-market/ByYiZxp8QrdN9qbdtaAiePN8AAr3qvTPppNJDpf5DVJ5/reserves/3AKyRviT87dt9jP3RHpfFjxmSVNbR68Wx7UejnUyaSFH',
        start,
        end,
        'JUP'
      ),
    ]);

    res.status(200).json({ message: 'Kamino data updated successfully' });
  } catch (error) {
    console.error('Error updating Kamino data:', error);
    res
      .status(500)
      .json({ message: 'Error updating Kamino data', error: error.toString() });
  }
}
