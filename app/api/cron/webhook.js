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

async function getDataFromDatabase() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(query);
    return rows;
  } catch (error) {
    console.error('Error fetching data from database:', error);
    throw error;
  } finally {
    connection.release();
  }
}

async function sendToDiscord(embed) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  try {
    await axios.post(webhookUrl, { embeds: [embed] });
    console.log('Message sent to Discord successfully.');
  } catch (error) {
    console.error('Error sending message to Discord:', error);
    throw error;
  }
}

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

async function generateAndSendEmbed() {
  const data = await getDataFromDatabase();
  const dateValue = getDateValue();

  if (data.length === 0) {
    console.log('No data available for today.');
    return { message: 'No data available for today.' };
  }

  const fields = data.map((row) => ({
    name: `${row.ASSET}\n${row.PROTOCOL}`,
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
  return { message: 'Discord message sent successfully.' };
}

export default async function handler(req, res) {
  console.log('Webhook handler called');
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const result = await generateAndSendEmbed();
      res.status(200).json(result);
    } catch (error) {
      console.error('An error occurred:', error);
      res
        .status(500)
        .json({ message: 'Internal server error', error: error.toString() });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
