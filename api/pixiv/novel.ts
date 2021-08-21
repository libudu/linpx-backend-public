import { Router } from 'express';
import app from '../../app';
import { touchNovelProfileFilter } from './filter';
import { getNovelDetail, getNovelProfiles, getRecentNovels } from '../../request/pixiv/novel';
import { getCacheNovel, getManyNovelProfiles } from '../../data/index';
import { LinpxData } from '../../model';
import { uid } from 'uid';
import { checkParamId, queryStringCheck, refreshError } from '../util';
import { query } from 'express-validator';
import { INovelAnalyse, INovelComment, INovelProfile } from '../../model/types';

// 大量小说简介
app.get('/pixiv/novels', async (req, res)=>{
  const ids = req.query?.ids as string[];
  if(!ids) return res.send({error: true});
  const [ profiles, analyses, { result: comments } ] = await Promise.all([
    getManyNovelProfiles(ids),
    getManyNovelAnalyse(ids),
    LinpxData.novelCommentList.findByIdList(ids),
  ]);
  const result = ids.filter(id => profiles[id]).map(id => ({
    ...profiles[id],
    likeCount: analyses[id].likeCount,
    commentCount: comments[id]?.commentIds.length || 0,
  }));
  return res.send(result);
});

// 最近小说，实时更新，一次一个请求，不需要缓存
app.get('/pixiv/novels/recent', async (req,res)=>{
  const page = Number(req.query.page) || 1;
  if(typeof page !== 'number') return res.send({error: true});

  const response: any = await getRecentNovels(String(page));
  const rowNovels = response.body.novels;
  const novels: INovelProfile[] = rowNovels.map((novel:any) => touchNovelProfileFilter(novel));
  const ids = novels.map(novel => novel.id);
  const [ analyses, { result: comments } ] = await Promise.all([
    getManyNovelAnalyse(ids),
    LinpxData.novelCommentList.findByIdList(ids),
  ]);
  const result = novels.map(novel => ({
    ...novel,
    likeCount: analyses[novel.id]?.likeCount || 0,
    commentCount: comments[novel.id]?.commentIds.length || 0,
  }));
  res.send(result);
});

// 对于某篇具体小说的处理
const novel = Router({ mergeParams: true });
app.use('/pixiv/novel/:id', [
  // 验证id参数
  checkParamId,
  refreshError, 
  novel,
]);

// 小说详情
novel.get('/', async (req, res)=>{
  const id = req.params.id;
  const novel = await getCacheNovel(id);
  if(!novel) return res.send({ error: true });
  return res.send(novel);
});

// 小说下载
novel.get('/download', (req, res) => {
  const id = req.params.id;
  getNovelDetail(id).then((response:any)=>{
    if(response.error) return res.send({error: true});
    const { title, userName, content } = response.body;
    const userInfo = `《${title}》 by ${userName}`;
    const mark = `${userInfo}\n上https://linpx.linpicio.com/看该作者更多小说`;
    const fileName = `${userInfo} in LINPX.txt`;
    const text = `${mark}\n\n${content}\n\n${mark}`;
    res.setHeader('Content-disposition', `attachment; filename=${encodeURIComponent(fileName)}`);
    res.setHeader('Content-type', 'text/plain');
    res.send(text);
  })
})

// 新增小说评论
novel.get('/comment/new',
  query('text').isString(),
  refreshError,
  async (req, res) => {
    const ip = req.headers['x-forwarded-for'];
    const id = req.params.id;
    const { text, reply } = req.query;
    if(!text) {
      return res.send({ error: true, msg: 'no text' });
    }
    if(Boolean(reply) && typeof reply !== 'string') {
      return res.send({ error: true, msg: 'reply must be string or null or undefined'});
    }
    const novelProfileMap = await getManyNovelProfiles([id]);
    const novelProfile = novelProfileMap[id];
    if(!novelProfile) {
      return res.send({ error: true, msg: 'novel do not exist' });
    }
    const { title, userId, userName } = novelProfile;
    // 插入一条评论
    const commentId = uid(8);
    LinpxData.novelComment.insert({
      id: commentId,
      novelId: id,
      title,
      content: String(text),
      reply: reply as any,
      postTime: Date.now(),
      ip: String(ip),
    });
    // 更新小说的评论列表
    const result = await LinpxData.novelCommentList.findById(id);
    let commentIds: string[] = [];
    if(result) {
      commentIds = result.commentIds;
      if(commentIds.length > 100) {
        return res.send({ error: true, msg: '评论数不得超过100' });
      }
    }
    commentIds.push(commentId);
    LinpxData.novelCommentList.insert({
      id,
      title,
      userId,
      userName,
      commentIds,
    });
    res.send({ error: false, msg: 'success' });
  }
);

// 获取小说评论
novel.get('/comments', async (req, res) => {
  const id = req.params.id;
  const novelCommentIds = await LinpxData.novelCommentList.findById(id);
  if(!novelCommentIds) return res.send({ error: false, data: [] });
  const commentIds = novelCommentIds.commentIds;
  const { result: novelCommentMap } = await LinpxData.novelComment.findByIdList(commentIds);
  res.send({
    error: false,
    data: commentIds.map(id => novelCommentMap[id]).filter(comment => comment),
  });
});

// 删除小说评论，仅相同ip可操作
novel.get('/comment/delete',
  queryStringCheck('commentId'),
  refreshError,
  async (req, res) => {
    const commentId = req.query.commentId as string;
    const comment = await LinpxData.novelComment.findById(commentId);
    if(comment) {
      const ip = req.headers['x-forwarded-for'];
      if(comment.ip !== ip) {
        res.send({ error: true, data: 'not your comment'});
      } else {
        res.send({ error: false, data: comment });
      }
    } else {
      res.send({ error: true, msg: 'comment do not exist' });
    }
  }
);

// 默认的小说分析
export const getDefaultNovelAnalyse = (id: string, pixivLikeCount: number): INovelAnalyse => {
  return {
    id,
    readCount: 0,
    todayReadMap: {},
    likeCount: 0,
    todayLikeMap: {},
    todayDate: (new Date()).getDate(),
    pixivLikeCount,
    history: [] as any,
  };
};

// 获取小说分析数据
const getNovelAnalyse = async (id: string, saveWhenCreate = false): Promise<INovelAnalyse | null> => {
  // 分析缓存
  const novelAnalyse = await LinpxData.novelAnalyse.findById(id);
  if(novelAnalyse) return novelAnalyse;
  // 小说概览
  const novelProfile = (await getManyNovelProfiles([id]))[id];
  // 不存在小说
  if(!novelProfile) return null;
  // 新建结果
  const analyse = getDefaultNovelAnalyse(id, novelProfile.pixivLikeCount);
  if(saveWhenCreate) LinpxData.novelAnalyse.insert(analyse);
  return analyse;
};

export const getManyNovelAnalyse = async (ids: string[]) => {
  const { result, left } = await LinpxData.novelAnalyse.findByIdList(ids);
  if(left) {
    const profiles = await getManyNovelProfiles(left);
    const newAnalyse: INovelAnalyse[] = [];
    left.forEach(id => {
      const analyse = getDefaultNovelAnalyse(id, profiles[id]?.pixivLikeCount || 0);
      result[id] = analyse;
      newAnalyse.push(analyse);
    });
    await LinpxData.novelAnalyse.insertMany(newAnalyse);
  }
  return result;
};

// 点击
novel.get('/click', async (req, res) => {
  const id = req.params.id;
  const ip = String(req.headers['x-forwarded-for'] || 'no ip');
  const analyse = await getNovelAnalyse(id);
  if(!analyse) return res.send({ error: true, msg: 'not valid novel id'});
  // 今日点击记录
  const todayReadMap = analyse.todayReadMap;
  const todayIpRead = todayReadMap[ip];
  if(!todayIpRead) {
    todayReadMap[ip] = 1;
    analyse.readCount += 1;
  // 同一篇小说每人每天最多计算10次点击
  } else if(todayIpRead < 10){
    todayReadMap[ip] += 1;
    analyse.readCount += 1;
  } else {
    return res.send({ error: true, msg: "today click more than 10 times" });
  }
  LinpxData.novelAnalyse.insert(analyse);
  res.send({ error: false, todayCount: todayIpRead + 1, readCount: analyse.readCount });
});

// 点赞
novel.get('/like', async (req, res) => {
  const id = req.params.id;
  const ip = String(req.headers['x-forwarded-for'] || 'no ip');
  const analyse = await getNovelAnalyse(id);
  if(!analyse) return res.send({ error: true, msg: 'not valid novel id'});
  // 今日点赞记录
  const todayLikeMap = analyse.todayLikeMap;
  const todayIpLike = todayLikeMap[ip];
  // 已经点赞了，不能重复点赞
  if(todayIpLike) {
    return res.send({ error: true, msg: "the ip already likes today"});
  }
  analyse.likeCount += 1;
  todayLikeMap[ip] = true;
  LinpxData.novelAnalyse.insert(analyse);
  return res.send({ error: false });
});

// 取消点赞
novel.get('/unlike', async (req, res) => {
  const id = req.params.id;
  const ip = String(req.headers['x-forwarded-for'] || 'no ip');
  const analyse = await getNovelAnalyse(id);
  if(!analyse) return res.send({ error: true, msg: 'not valid novel id'});
  // 今日点赞记录
  const todayLikeMap = analyse.todayLikeMap;
  const todayIpLink = todayLikeMap[ip];
  // 之前没点赞，不能取消点赞
  if(!todayIpLink) {
    return res.send({ error: true, msg: "the ip doesnot like before"});
  }
  analyse.likeCount -= 1;
  delete analyse.todayLikeMap[ip];
  LinpxData.novelAnalyse.insert(analyse);
  return res.send({ error: false });
});

// 获取分析信息
novel.get('/analyse', async (req, res) => {
  const id = req.params.id;
  const analyse = await getNovelAnalyse(id, true);
  if(analyse) {
    const ip = String(req.headers['x-forwarded-for'] || 'no ip');
    const { readCount, likeCount, pixivLikeCount, todayLikeMap } = analyse;
    // 没有记录则能点赞，有记录则不能点赞
    const todayLike = todayLikeMap[ip];
    return res.send({ id, readCount, likeCount, pixivLikeCount, ip, canLike: !todayLike });
  }
  return res.send(null);
});