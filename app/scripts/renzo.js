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

const updateDataInDatabase = async (symbol, lendingRate) => {
  try {
    const connection = await getConnection();

    const dateValue = getDateValue();
    const query = `
    INSERT INTO protocols (DATE, PROTOCOL, URL, BLOCKCHAIN, TYPE, ASSET, YIELD, AUM, DEPOSIT, WITHDRAW, TVL)
    VALUES ('${dateValue}', 'RENZO', 'https://app.renzoprotocol.com/restake', 'ETHERUM', 'STAKING', '${symbol}', '${lendingRate}', NULL, NULL, NULL, NULL);`;

    await connection.execute(query, [lendingRate]);

    connection.release();

    console.log(
      `RENZO : La valeur de ${symbol} a été mise à jour : ${lendingRate}.`
    );
  } catch (error) {
    console.error(
      `RENZO : Erreur lors de la mise à jour de la valeur pour ${symbol} :`,
      error
    );
  }
};

const fetchAndUpdateData = async (url, symbol) => {
  try {
    const response = await axios.get(url);
    const data = response.data;

    if (
      data &&
      data.data &&
      data.data.apr &&
      data.data.apr.data &&
      data.data.apr.data.rate
    ) {
      const lendingRate = parseFloat(data.data.apr.data.rate).toFixed(2);

      await updateDataInDatabase(symbol, lendingRate);
    } else {
      console.log(`RENZO : No data available for ${symbol}.`);
    }
  } catch (error) {
    console.error(`RENZO : Error fetching data for ${symbol}:`);
  }
};

const urlETH = 'https://app.renzoprotocol.com/api/stats?chainId=1';

fetchAndUpdateData(urlETH, 'ETH');
