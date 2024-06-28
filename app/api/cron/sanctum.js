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

async function updateDataInDatabase(crypto, apy) {
  const connection = await pool.getConnection();
  try {
    const dateValue = getDateValue();
    const query = `
    INSERT INTO protocols (DATE, PROTOCOL, URL, BLOCKCHAIN, TYPE, ASSET, YIELD, AUM, DEPOSIT, WITHDRAW, TVL)
    VALUES (?, 'SANCTUM', 'https://app.sanctum.so/lsts', 'SOLANA', 'STAKING', ?, ?, NULL, NULL, NULL, NULL);`;

    await connection.execute(query, [
      dateValue,
      crypto,
      (apy * 100).toFixed(2),
    ]);

    console.log(
      `SANCTUM : La valeur de ${crypto} a été mise à jour avec succès: ${(
        apy * 100
      ).toFixed(2)}`
    );
  } catch (error) {
    console.error(
      `SANCTUM : Erreur lors de la mise à jour de la valeur pour ${crypto} :`,
      error
    );
    throw error;
  } finally {
    connection.release();
  }
}

const url = 'https://sanctum-extra-api.ngrok.dev/v1/apy/latest';
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
const fullUrl = `${url}?${lstParams}`;

async function fetchAndUpdateData() {
  try {
    const response = await axios(fullUrl, options);
    const updatePromises = Object.entries(crypto).map(([key, value]) => {
      const apy = response.data.apys[key];
      if (apy !== undefined) {
        return updateDataInDatabase(value, apy);
      } else {
        console.log(`SANCTUM : No data available for ${value}.`);
        return Promise.resolve();
      }
    });

    await Promise.all(updatePromises);
    return { success: true, message: 'Sanctum data updated successfully' };
  } catch (error) {
    console.error('SANCTUM : Error fetching or updating data:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  // Vérification de sécurité
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const result = await fetchAndUpdateData();
      res.status(200).json(result);
    } catch (error) {
      console.error('Error updating Sanctum data:', error);
      res
        .status(500)
        .json({
          message: 'Error updating Sanctum data',
          error: error.toString(),
        });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
