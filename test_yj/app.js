const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

app.use(express.json());
 
const progressRouter = require('./routes/progress');
const infoRouter = require('./routes/info'); 
const unitDataRouter = require('./routes/unitData');

app.use('/api/unitData', unitDataRouter);
app.use('/api/info', infoRouter); 
app.use('/api/progress', progressRouter);
app.listen(4000, () => {
  console.log('서버가 http://localhost:4000 에서 실행 중입니다.');
});
app.get('/', (req, res) => {
  res.status(200).send('OK');
});
