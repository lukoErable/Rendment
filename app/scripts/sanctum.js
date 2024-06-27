const axios = require('axios');
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

const updateDataInDatabase = async (crypto, apy) => {
  try {
    const connection = await getConnection();

    const dateValue = getDateValue();
    const query = `
    INSERT INTO protocols (DATE, PROTOCOL, URL, BLOCKCHAIN, TYPE, ASSET, YIELD, AUM, DEPOSIT, WITHDRAW, TVL)
    VALUES ('${dateValue}', 'SANCTUM', 'https://app.sanctum.so/lsts', 'SOLANA', 'STAKING', '${crypto}', '${(
      apy * 100
    ).toFixed(2)}', NULL, NULL, NULL, NULL);`;

    await connection.execute(query);

    connection.release();

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
  }
};

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

axios(fullUrl, options)
  .then((response) => {
    Object.entries(crypto).forEach(([key, value]) => {
      const apy = response.data.apys[key];
      if (apy !== undefined) {
        updateDataInDatabase(value, apy);
      } else {
        console.log(`SANCTUM : No data available for ${value}.`);
      }
    });
  })
  .catch((error) => {
    console.error('SANCTUM : Error fetching data:');
  });
