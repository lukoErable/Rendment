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

async function updateDataInDatabase(symbol, lendingRate, TVL) {
  const connection = await pool.getConnection();
  try {
    const dateValue = getDateValue();
    const query = `
    INSERT INTO protocols (DATE, PROTOCOL, URL, BLOCKCHAIN, TYPE, ASSET, YIELD, AUM, DEPOSIT, WITHDRAW, TVL)
    VALUES (?, 'RAYDIUM', 'https://raydium.io/staking/', 'SOLANA', 'STACKING', ?, ?, NULL, NULL, NULL, ?);`;

    await connection.execute(query, [dateValue, symbol, lendingRate, TVL]);

    console.log(
      `RAYDIUM : La valeur de ${symbol} a été mise à jour avec succès : ${lendingRate}.`
    );
  } catch (error) {
    console.error(
      `Erreur lors de la mise à jour de la valeur pour ${symbol} :`,
      error
    );
    throw error;
  } finally {
    connection.release();
  }
}

async function fetchAndUpdateData(url, symbol) {
  try {
    const response = await axios.get(url);
    const data = response.data.data.data;

    if (data.length > 0) {
      const firstRecord = data[0].apr;
      const lendingRate = (firstRecord * 100).toFixed(2);
      const TVL = data[0].tvl;
      await updateDataInDatabase(symbol, lendingRate, TVL);
    } else {
      console.log(`RAYDIUM : No data available for ${symbol}.`);
    }
  } catch (error) {
    console.error(`RAYDIUM : Error fetching data for ${symbol}:`, error);
    throw error;
  }
}

const urlRAY = 'https://api-v3.raydium.io/main/stake-pools';

export default async function handler(req, res) {
  // Vérification de sécurité
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      await fetchAndUpdateData(urlRAY, 'RAY');
      res.status(200).json({ message: 'Raydium data updated successfully' });
    } catch (error) {
      console.error('Error updating Raydium data:', error);
      res
        .status(500)
        .json({
          message: 'Error updating Raydium data',
          error: error.toString(),
        });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
