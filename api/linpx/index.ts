import app from '../../app';
import request from 'request';
import { proxy } from '../../request/pixiv';
import { getCacheFavUsers } from '../../data/index';
import { LinpxData } from '../../model';

app.get('/', (req, res) => {
  res.send('welcome to linpx backend');
});

app.get('/fav/user', async (req, res)=>{
  const favUser = await getCacheFavUsers();
  const ids = favUser.map(user => user.id);
  const { result } = await LinpxData.userAddition.findByIdList(ids);
  res.send(favUser.map(user => ({...user, ...result[user.id] })));
});

app.get('/proxy/pximg', (req, res)=>{
  const url:string = req.query.url as string;
  request({
    url,
    headers: {
      referer: 'https://www.pixiv.net'
    },
    encoding: null,
    proxy,
  }, (err, response, body)=>{
    res.setHeader('Content-Type', 'image/jpeg');
    res.send(body);
  });
})