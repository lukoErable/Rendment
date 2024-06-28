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

async function updateDataInDatabase(symbol, yieldValue, TVL) {
  const connection = await pool.getConnection();
  try {
    const dateValue = getDateValue();
    const query = `
      INSERT INTO protocols (DATE, PROTOCOL, URL, BLOCKCHAIN, TYPE, ASSET, YIELD, AUM, DEPOSIT, WITHDRAW, TVL)
      VALUES (?, 'METEORA', 'https://app.meteora.ag/vaults', 'SOLANA', 'FARMING', ?, ?, NULL, NULL, NULL, ?)
      ON DUPLICATE KEY UPDATE YIELD = VALUES(YIELD), TVL = VALUES(TVL);`;

    await connection.execute(query, [dateValue, symbol, yieldValue, TVL]);

    console.log(
      `METEORA : La valeur de ${symbol} a été mise à jour : ${yieldValue}.`
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

async function fetchAndUpdateData(url) {
  try {
    const response = await axios.get(url);
    const data = response.data;

    const tokensToProcess = ['USDC', 'USDT', 'SOL'];
    const updatePromises = tokensToProcess.map(async (tokenSymbol) => {
      const tokenData = data.find((item) => item.symbol === tokenSymbol);
      if (tokenData) {
        const { closest_apy: yieldValue, token_amount: TVL } = tokenData;
        await updateDataInDatabase(tokenSymbol, yieldValue, TVL);
      }
    });

    await Promise.all(updatePromises);
  } catch (error) {
    console.error(`METEORA : Error fetching data from ${url}:`, error);
    throw error;
  }
}

const url = 'https://app.meteora.ag/vault/vault_info';

export default async function handler(req, res) {
  // Vérification de sécurité
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      await fetchAndUpdateData(url);
      res.status(200).json({ message: 'Meteora data updated successfully' });
    } catch (error) {
      console.error('Error updating Meteora data:', error);
      res
        .status(500)
        .json({
          message: 'Error updating Meteora data',
          error: error.toString(),
        });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
