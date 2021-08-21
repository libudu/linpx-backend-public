import app from '../../app';
import { proxyImg } from '../../utils/util';
import { searchNovel, searchUser } from '../../request/pixiv/search';
import { touchNovelProfileFilter, novelProfileFilter } from './filter';

// 搜索页频率低，一次一个请求，词频动态，不缓存

// 搜索用户
app.get('/pixiv/search/user/:name', (req, res)=>{
  const page = Number(req.query.page) || 1;
  const name = encodeURIComponent(req.params.name);
  
  if(!name || typeof page !== 'number') return res.send({error: true});

  searchUser(name, page).then(({ body }:any) => {
    const users = body.users.map((user:any) => ({
      id: user.user_id,
      name: user.user_name,
      imageUrl: proxyImg(user.profile_img.main),
      comment: user.user_comment,
      novels: user.novels.map((novel:any) => touchNovelProfileFilter(novel)),
    }))
    const result = {
      total: body.total,
      users,
    };
    res.send(result);
  })
});

// 搜索小说
app.get('/pixiv/search/novel/:name', (req, res)=>{
  const page = Number(req.query.page) || 1;
  const name = encodeURIComponent(req.params.name);
  if(!name || typeof page !== 'number') return res.send({error: true});

  searchNovel(name, page).then((response:any) => {
    const { data: novels, total } = response.body.novel;
    res.send({
      novels: novels.map((novel:any) => novelProfileFilter(novel)),
      total,
    });
  })
});