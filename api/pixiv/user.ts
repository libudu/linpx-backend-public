import app from '../../app';
import { novelProfileFilter } from './filter';
import { getUserTagNovels } from '../../request/pixiv/tag';
import { getCacheUser, getCacheUserList } from '../../data';

// 用户信息
// 包含：用户全部小说id、用户基本信息、用户标签统计
app.get('/pixiv/user/:id', async (req, res) => {
  const id = req.params.id;
  if(!id) return { error: true };
  let result = await getCacheUser(id);
  res.send(result || { error: true });
});

// 批量查询作者接口
app.get('/pixiv/users', async (req, res) => {
  const ids = req.query?.ids as string[];
  if(!ids) return res.send({error: true});
  return res.send(await getCacheUserList(ids));
})

// 用户某个标签的全部小说
app.get('/pixiv/user/:id/tag/:tagName', (req, res) => {
  const { id, tagName } = req.params;
  getUserTagNovels(id, tagName).then((result:any) => {
    const novels = result.body.works
    res.send(novels.map((novel:any) => novelProfileFilter(novel)));
  });
})
