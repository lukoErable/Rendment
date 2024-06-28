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

async function updateDataInDatabase(symbol, lendingRate) {
  const connection = await pool.getConnection();
  try {
    const dateValue = getDateValue();
    const query = `
    INSERT INTO protocols (DATE, PROTOCOL, URL, BLOCKCHAIN, TYPE, ASSET, YIELD, AUM, DEPOSIT, WITHDRAW, TVL)
    VALUES (?, 'MANGO', 'https://app.mango.markets/', 'SOLANA', 'LENDING', ?, ?, NULL, NULL, NULL, NULL);`;

    await connection.execute(query, [dateValue, symbol, lendingRate]);

    console.log(
      `MANGO : La valeur de ${symbol} a été mise à jour avec succès : ${lendingRate}.`
    );
  } catch (error) {
    console.error(
      `MANGO : Erreur lors de la mise à jour de la valeur pour ${symbol} :`,
      error
    );
    throw error;
  } finally {
    connection.release();
  }
}

async function fetchAndUpdateData(url, symbol, retries = 5, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url);
      const data = response.data;

      if (Array.isArray(data) && data.length > 0) {
        const firstRecord = data[0].deposit_apr;
        const lendingRate = (firstRecord * 100).toFixed(2);

        await updateDataInDatabase(symbol, lendingRate);
        return;
      } else {
        console.log(`MANGO : No data available for ${symbol}.`);
        return;
      }
    } catch (error) {
      console.error(
        `MANGO : Error fetching data for ${symbol} (attempt ${attempt}):`,
        error
      );

      if (attempt < retries) {
        console.log(`MANGO : Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error(
          `MANGO : Failed to fetch data for ${symbol} after ${retries} attempts.`
        );
        throw error;
      }
    }
  }
}

const urls = {
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

async function fetchAllData() {
  for (const [symbol, url] of Object.entries(urls)) {
    await fetchAndUpdateData(url, symbol);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

export default async function handler(req, res) {
  // Vérification de sécurité
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      await fetchAllData();
      res.status(200).json({ message: 'Mango data updated successfully' });
    } catch (error) {
      console.error('Error updating Mango data:', error);
      res
        .status(500)
        .json({
          message: 'Error updating Mango data',
          error: error.toString(),
        });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
