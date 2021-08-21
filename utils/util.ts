const { t2s } = require('chinese-s2t');

export function proxyImg(url:string){
  return url;
}

export function containJapanese(text: string) {
  return text.search(/[\u3040-\u30ff\uf900-\ufaff\uff66-\uff9f]/) !== -1;
}

const sameTag = {
  // 繁体和日文
  '龙': ['竜'],
  '龙人': ['竜人', '龙兽人', '竜兽人'],
  '兽人': ['獣人', '獸人', '兽控'],
  '恶堕': ['悪堕', '恶坠', '悪堕ち', '堕落'],
  '年下攻': ['年下攻め'],
  '腐向': ['腐向け'],
  '龟头责': ['亀头责め'],
  '性器破坏': ['性器破壊'],
  // 英文
  'r-18': ['r18', '18', '色情'],
  'r-18g': ['r18g'],
  'furry': ['furyy', '兽', '獣'],
  'bl': ['bl向', 'gay'],
  'transfur': ['tf'],
  'tickle': ['tk', '挠痒', '挠痒痒', 'tickling'],
  'vore': ['丸吞'],
  'rbq': ['肉便器'],
  // ip中英文
  '英雄联盟': ['lol'],
  '怪物猎人': ['monsterhunter'],
  '家有大猫': ['nekojishi'],
  '罗曼圣诞探案集': ['罗曼圣诞探案集#'],
  '魔兽世界': ['wow'],
  '失落的龙约': ['失控的龙约'],
  // 后缀
  '囚禁': ['囚禁play'],
  '主奴': ['主奴play'],
  '触手': ['触手play'],
  '兄弟': ['兄弟丼', '兄弟play#'],
  '足控': ['足控向', 'feet'],
  '剧情': ['剧情向'],
  '尿道': ['尿道play', '尿道奸', '尿道责', '尿道交'],
  '尿': ['尿液'],
  // 同义
  '药物催淫': ['药物催情', '药物'],
  '警察': ['警官'],
  '筋肉': ['肌肉'],
  '阉割': ['去势'],
  '败北': ['战败'],
  '奴隶': ['奴役', '奴化'],
  '同性': ['同性向', '同性爱', '同性恋'],
  '同人': ['二次创作'],
  '体型差': ['体格差'],
  '肉体改造': ['身体改造'],
  '射精': ['大量射精'],
  '射精控制': ['射精管理'],
  '捆绑束缚': ['捆绑', '拘束', '束缚', '紧缚'],
};

const invalidTagSet = new Set([
  '小说', '小説',
  '中文', '中國語', 'chinese', '中国语','简体中文', '繁体中文', '中国语注意',
  '约稿', '委托',
  '原创',
  '无',
  '短篇', '极短篇',
]);

const checkSameTagMap: { [tag: string]: string } = {};
Object.entries(sameTag).forEach(([trueTagName, sameTagList]) => {
  sameTagList.forEach(sameTagName => checkSameTagMap[sameTagName] = trueTagName);
});

export function tagFilter(
  tagName: string,
  config: {
    same: boolean,      // 合并同类tag 
    lowercase: boolean, // tag小写转化
  } = {
    same: false,
    lowercase: false,
  },
): string | null {
  // tag小写转化
  if(config.lowercase) tagName = t2s(tagName).toLowerCase();
  // 去除无效tag
  if(invalidTagSet.has(tagName)) return null;
  // 合并同类tag 
  if(config.same) {
    const trueTagName = checkSameTagMap[tagName];
    if(trueTagName) return trueTagName;
  }
  return tagName;
}