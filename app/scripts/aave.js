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

const updateDataInDatabase = async (url, symbol) => {
  try {
    const response = await axios.get(url);
    const data = response.data;

    if (Array.isArray(data) && data.length > 0) {
      const lastRecord = data[data.length - 1].variableBorrowRate_avg;
      const valueToUpdate = (lastRecord * 100).toFixed(2);
      const connection = await getConnection();
      const dateValue = getDateValue();

      const query = `
INSERT INTO protocols (DATE, PROTOCOL, URL, BLOCKCHAIN, TYPE, ASSET, YIELD, AUM, DEPOSIT, WITHDRAW, TVL)
VALUES ('${dateValue}', 'AAVE', 'https://app.aave.com/markets', 'ETHERUM', 'LENDING', '${symbol}', '${valueToUpdate}', NULL, NULL, NULL, NULL);
`;

      await connection.execute(query);

      connection.release();

      console.log(
        `AAVE : La valeur de ${symbol} a été mise à jour avec succès.`
      );
    } else {
      console.log(`AAVE : Aucune donnée disponible pour ${symbol}.`);
    }
  } catch (error) {
    console.error(
      `AAVE :  Erreur lors de la mise à jour de la valeur pour ${symbol} :`
    );
  }
};

const urlUSDC =
  'https://aave-api-v2.aave.com/data/rates-history?reserveId=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb480x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e1&from=1713782525&resolutionInHours=6';

const urlETH =
  ' https://aave-api-v2.aave.com/data/rates-history?reserveId=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc20x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e1&from=1713783127&resolutionInHours=6';

updateDataInDatabase(urlUSDC, 'USDC');
updateDataInDatabase(urlETH, 'ETH');
