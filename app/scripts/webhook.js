const axios = require('axios');
const { color } = require('chart.js/helpers');
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

const query = `
  SELECT PROTOCOL, 
        CASE 
            WHEN ASSET IN ('JPSOL', 'INF', 'HSOL', 'BONKSOL', 'JITOSOL', 'MSOL') THEN 'SOL'
            ELSE ASSET
        END AS ASSET,
        YIELD
  FROM (
      SELECT p.PROTOCOL, 
            CASE 
                WHEN p.ASSET IN ('JPSOL', 'INF', 'HSOL', 'BONKSOL', 'JITOSOL', 'MSOL') THEN 'SOL'
                ELSE p.ASSET
            END AS ASSET,
            p.YIELD,
            ROW_NUMBER() OVER(PARTITION BY 
                              CASE WHEN p.ASSET IN ('JPSOL', 'INF', 'HSOL', 'BONKSOL', 'JITOSOL', 'MSOL') THEN 'SOL' ELSE p.ASSET END
                              ORDER BY p.YIELD DESC) AS rn
      FROM protocols p
      WHERE p.DATE = CURDATE()
  ) ranked
  WHERE rn = 1
  ORDER BY YIELD DESC;

`;

const getDataFromDatabase = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(query);
    return rows;
  } catch (error) {
    console.error('Error fetching data from database:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

const sendToDiscord = async (embed) => {
  const webhookUrl =
    'https://discord.com/api/webhooks/1245730724535861248/bX623OsB1DltZXcpaHc2LjG9a8fmgtaoZNl-nSC8KR_wx_ZlAuduNYRsExA5rpHCkQze';
  try {
    await axios.post(webhookUrl, { embeds: [embed] });
    console.log('Message sent to Discord successfully.');
  } catch (error) {
    console.error('Error sending message to Discord:', error);
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

const main = async () => {
  try {
    const data = await getDataFromDatabase();
    const dateValue = getDateValue();
    if (data.length === 0) {
      console.log('No data available for today.');
      return;
    }

    const fields = data.map((row) => ({
      name: `${row.ASSET}\n${row.PROTOCOL}`,
      description: `APY: ${row.YIELD} %             `,
      value: `APY: ${row.YIELD}%`,
      inline: true,
    }));

    const embed = {
      title: 'Max Yields of the day',
      color: Math.floor(Math.random() * 16777215),
      description: `${dateValue}`,
      fields: fields,
      thumbnail: {
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcXJpOGhudmYzZnFhOWFlMTZiMWJzZHRnczB2ZG1vMm43OThiMGp0diZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/VRKheDy4DkBMrQm66p/giphy.gif',
      },
    };

    await sendToDiscord(embed);
  } catch (error) {
    console.error('An error occurred:', error);
  }
};

// Exécuter le script
main();
