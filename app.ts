import express from 'express';
import { initDatabase } from './model';

const app = express();
export default app;

import './api/index';
import './schedule/index';
import { PORT } from './linpxconfig';

initDatabase().then(() => {
  console.log('数据库初始化完毕！');
  app.listen(PORT, () => {
      console.log(`服务已启动，运行于${PORT}端口。`);
  });
})