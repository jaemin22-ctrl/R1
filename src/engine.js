import {PERSONAL_EVENTS} from './events.js';
import {CULTURES,POLITIES,FOCUSES,JOBS,HISTORIES} from './data.js';
export const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,n));
export function random(s){let t=s.rng+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;}
export const pick=(s,arr)=>arr[Math.floor(random(s)*arr.length)];
const range=(s,a,b)=>Math.floor(random(s)*(b-a+1))+a;
export function personalName(s,sex=s.sex){const c=CULTURES[s.culture];let given=pick(s,sex==='여성'?c.female:c.male);if(s.culture==='korea'&&s.year<900)given=pick(s,sex==='여성'?['달이','고운','아리']:['무돌','모루','바우']);if((s.culture==='japan'&&s.year<1875&&s.origin!=='유력 가문')||(['west','britain','byzantium'].includes(s.culture)&&s.year<1100)||(s.culture==='korea'&&s.year<900))return given;const family=pick(s,c.family);return ['korea','china'].includes(s.culture)?family+given:given+' '+family;}
export function createLife(mode='all',seed=Date.now()>>>0,century='random'){
 const s={version:1,rng:seed,seed,mode,age:0,alive:true,focus:'balance',ap:2,job:null,partner:null,children:[],logs:[],history:[],branches:[],samples:[],pending:null,learned:false,retired:false,yearActions:[],cooldowns:{},actionsTaken:0};
 let min=1,max=2000;if(mode==='medieval'){min=500;max=1500;}else if(century!=='random'){const c=Number(century);min=c===0?1:(c-1)*100+1;max=c===0?99:c*100;}
 s.birthYear=range(s,min,max);s.year=s.birthYear;const p=pick(s,POLITIES.filter(p=>p.start<=s.year&&p.end>=s.year));s.polity=p.name;s.culture=p.culture;s.city=p.city;s.currency=p.currency;s.location=pick(s,['마을','마을','작은 도시','농촌']);s.sex=pick(s,['여성','남성']);s.origin=pick(s,['소작농 가정','소작농 가정','자작농 가정','수공업자 가정','상인 가정','품팔이 가정','유력 가문']);s.name=personalName(s);s.parent=personalName(s,'여성');s.siblings=range(s,0,4);s.wealth=s.origin==='유력 가문'?100:s.origin==='상인 가정'?50:range(s,5,24);s.stats={health:range(s,55,89),happiness:range(s,48,82),knowledge:range(s,1,6),skill:range(s,1,8),bonds:range(s,40,78),reputation:range(s,4,18)};s.initialWealth=s.wealth;s.income=0;s.expense=0;s.literate=false;
 log(s,'birth','세상에 첫 숨을 내쉬다',`${s.year}년, ${s.polity}의 ${s.location}. ${s.origin}에서 ${s.sex==='여성'?'딸':'아들'} ${s.name}${post(s.name,'이','가')} 태어났습니다. 형제자매는 ${s.siblings}명. ${CULTURES[s.culture].architecture}에서 당신의 한 생이 시작됩니다. 현대의 기억은 없습니다.`);sample(s);return s;
}
function post(name,a,b){const code=name.charCodeAt(name.length-1)-44032;return code>=0&&code<11172&&code%28?a:b;}
export function log(s,type,title,text){s.logs.push({id:s.logs.length,age:s.age,year:s.year,type,title,text});}
function sample(s){s.samples.push({age:s.age,wealth:Math.round(s.wealth),...s.stats});}
export function apply(s,effects={}){for(const[k,v]of Object.entries(effects)){if(k==='wealth')s.wealth=Math.max(0,s.wealth+v);else if(k in s.stats)s.stats[k]=clamp(s.stats[k]+v);}if(s.stats.knowledge>=35)s.literate=true;}
export function income(s){if(s.age<14||s.retired||!s.job)return 0;const j=JOBS.find(j=>j.id===s.job);return Math.round(j.pay*(.65+s.stats[j.stat]/100)*(s.focus==='work'?1.25:1));}
export function spending(s){return s.age<14?0:Math.round(8+(s.location==='도시'?5:0)+s.children.filter(c=>s.year-c.born<16&&c.alive).length*3+(s.partner?3:0));}
export function status(s){return s.age<6?'어린아이':s.age<14?'배우는 아이':s.retired?'은퇴':s.job?JOBS.find(j=>j.id===s.job).name:'생업을 찾는 중';}
export function canJob(s,j){if(s.age<j.age)return `${j.age}세부터`;if(j.test&&!j.test(s))return '시대·지역 조건';if(j.sex&&s.sex!==j.sex&&s.year<1950)return '당대의 성별 관습';if(['official','soldier'].includes(j.id)&&s.sex==='여성'&&s.year<1950)return '당대의 제도적 장벽';if(s.stats[j.stat]<j.need)return `${({health:'건강',knowledge:'지식',skill:'솜씨'})[j.stat]} ${j.need} 필요`;if(j.literacy&&!s.literate)return '문해력 필요';if((j.cost||0)>s.wealth)return `살림 ${j.cost} 필요`;return null;}
const A=(id,category,title,desc,effects={},opts={})=>({id,category,title,desc,effects,...opts});
export const ACTIONS=[
 A('literacy','배움','글자를 배우다','가까운 글 아는 이에게 기초를 배웁니다.',{knowledge:7,wealth:-2},{age:6,cost:2}),
 A('count','배움','셈을 익히다','곡식과 물건의 수량을 세며 연습합니다.',{knowledge:4,skill:3},{age:6}),
 A('listen','배움','어른의 이야기를 듣다','마을과 집안에 전해지는 이야기를 기억합니다.',{knowledge:3,bonds:3},{age:3}),
 A('copy','배움','문서를 베껴 쓰다','배운 글을 기록하며 손에 익힙니다.',{knowledge:6,skill:2},{age:10,literacy:true}),
 A('master','배움','장인에게 기술을 배우다','작업장 심부름부터 시작해 솜씨를 익힙니다.',{skill:7,wealth:-3},{age:10,cost:3}),
 A('herbs','배움','약초의 쓰임을 익히다','지역의 치료 지식을 배웁니다. 효능에는 한계가 있습니다.',{knowledge:4,skill:3},{age:12}),
 A('book','배움','책을 빌려 읽다','귀한 책 한 권을 빌려 오래 읽습니다.',{knowledge:9,wealth:-4},{age:12,cost:4,literacy:true}),
 A('teach','배움','아이에게 아는 것을 가르치다','글과 셈, 생업의 지식을 나눕니다.',{bonds:5,reputation:4,knowledge:2},{age:18,need:{knowledge:35}}),
 A('exam','시대','과거 공부를 하다','시험은 긴 준비가 필요합니다. 공부가 합격을 보장하지 않습니다.',{knowledge:10,wealth:-8,happiness:-2},{age:16,cost:8,literacy:true,test:s=>s.sex==='남성'&&((s.culture==='korea'&&s.year>=958&&s.year<1894&&s.origin!=='품팔이 가정')||(s.culture==='china'&&s.year>=605&&s.year<1905)),note:'과거 제도가 운영되는 지역·시기, 가문과 신분 제약을 간략화했습니다.'}),
 A('hangul','시대','새 문자를 배우다','훈민정음의 원리를 배워 짧은 편지를 씁니다.',{knowledge:9,bonds:2},{age:8,test:s=>s.culture==='korea'&&s.year>=1446&&s.year<1900}),
 A('school','시대','학교에 다니다','보급된 근대 교육의 기회를 찾습니다.',{knowledge:10,wealth:-5},{age:6,maxAge:24,cost:5,test:s=>s.year>=1900}),
 A('faith','여가','신앙 공동체를 찾다','지역에 존재하는 신앙 공간에서 마음을 돌봅니다.',{happiness:4,bonds:5},{age:8}),
 A('song','여가','노래를 부르다','일과 놀이에 전해지는 가락을 함께 부릅니다.',{happiness:6,bonds:2},{age:3}),
 A('game','여가','마을 놀이에 어울리다','시대에 맞는 공놀이와 패 놀이를 즐깁니다.',{happiness:5,bonds:3},{age:5}),
 A('walk','건강','가까운 길을 걷다','무리하지 않고 움직이며 몸을 살핍니다.',{health:4,happiness:3},{age:5}),
 A('rest','건강','충분히 쉬다','하루 일을 덜고 잠과 휴식을 챙깁니다.',{health:7,happiness:2},{age:3}),
 A('water','건강','물과 음식 보관에 신경 쓰다','당대에 가능한 범위에서 깨끗한 물과 음식을 구합니다.',{health:5,wealth:-2},{age:12,cost:2}),
 A('healer','건강','치료사를 찾아가다','당대 치료법에는 효과와 위험이 공존합니다.',{health:6,wealth:-6},{age:14,cost:6,risk:0.15,riskEffect:{health:-12}}),
 A('meal','건강','식사를 보충하다','형편 안에서 더 든든한 음식을 마련합니다.',{health:5,happiness:3,wealth:-4},{age:14,cost:4}),
 A('clinic','건강','근대 진료를 받다','의료기관에 방문해 진료를 받습니다.',{health:12,wealth:-10},{age:14,cost:10,test:s=>s.year>=1950}),
 A('friend','관계','친구에게 안부를 전하다','서로의 생활을 나누며 인연을 이어 갑니다.',{bonds:7,happiness:3},{age:5}),
 A('neighbor','관계','이웃의 일을 돕다','지붕 수리나 수확에 일손을 보탭니다.',{bonds:6,reputation:4,health:-1},{age:12}),
 A('gift','관계','작은 선물을 마련하다','감당할 수 있는 선물로 마음을 전합니다.',{bonds:8,wealth:-5},{age:14,cost:5}),
 A('feast','관계','함께 식사하다','이웃을 불러 음식을 나누고 이야기를 듣습니다.',{bonds:8,happiness:5,wealth:-6},{age:16,cost:6}),
 A('meet','관계','혼인 인연을 알아보다','가족과 공동체의 관습 안에서 상대를 만납니다.',{bonds:3},{age:18,test:s=>!s.partner,special:'meet',cooldown:2}),
 A('marry','관계','혼인하다','만남을 이어 온 상대와 살림을 꾸립니다.',{happiness:9,bonds:9,wealth:-12},{age:18,cost:12,test:s=>!s.partner&&!!s.suitor,special:'marry'}),
 A('spouse','관계','배우자와 시간을 보내다','가까운 사람의 이야기에 귀를 기울입니다.',{bonds:9,happiness:5},{age:18,test:s=>!!s.partner}),
 A('child','관계','아이를 맞이할 준비를 하다','임신과 출산에는 불확실성과 위험이 따릅니다.',{wealth:-6,bonds:3},{age:18,maxAge:45,cost:6,test:s=>!!s.partner,special:'child',cooldown:2}),
 A('parent','관계','아이와 시간을 보내다','함께 놀며 아는 것을 가르쳐 줍니다.',{bonds:9,happiness:5},{age:18,test:s=>s.children.some(c=>c.alive)}),
 A('separate','관계','별거를 상의하다','법적 이혼과 구별됩니다. 가족과 재산 문제를 감수합니다.',{happiness:-4,wealth:-10,bonds:-10},{age:18,cost:10,test:s=>!!s.partner,special:'separate'}),
 A('divorce','관계','법적 이혼을 신청하다','법이 허용하는 지역·시기에 혼인 관계를 정리합니다.',{wealth:-18,happiness:-2,bonds:-8},{age:18,cost:18,test:s=>!!s.partner&&((s.culture==='america'&&s.year>=1900)||(s.culture==='britain'&&s.year>=1858)||(s.culture==='west'&&s.year>=1884)||(s.culture==='korea'&&s.year>=1950)||(s.culture==='japan'&&s.year>=1898)),special:'separate'}),
 A('save','살림','지출을 줄이다','작은 소비를 아끼며 다음 계절을 준비합니다.',{wealth:5,happiness:-3},{age:14}),
 A('tools','살림','도구를 수리하다','손에 익은 도구를 오래 쓸 수 있게 돌봅니다.',{skill:5,wealth:2},{age:12}),
 A('garden','살림','텃밭을 가꾸다','집 주변의 땅에서 먹거리를 보탭니다.',{health:2,wealth:4,skill:2},{age:12}),
 A('preserve','살림','먹거리를 저장하다','말리거나 절이는 당대의 방법으로 식량을 지킵니다.',{wealth:3,skill:4},{age:12}),
 A('house','살림','거처를 수선하다','새는 지붕과 바람 드는 벽을 손봅니다.',{health:4,happiness:4,wealth:-8},{age:16,cost:8}),
 A('rural','살림','농촌으로 이사하다','생활비를 줄이고 익숙한 농사일을 찾습니다.',{wealth:-10,health:3},{age:18,cost:10,test:s=>s.location!=='농촌',special:'rural'}),
 A('urban','살림','도시로 이사하다','새로운 일과 교육의 기회를 찾아갑니다.',{wealth:-18,knowledge:3,happiness:2},{age:18,cost:18,test:s=>s.location!=='도시',special:'urban'}),
 A('land','살림','작은 경작지를 마련하다','당대 토지 관습 안에서 사용권을 확보합니다.',{wealth:-40,reputation:6},{age:20,cost:40,special:'land',test:s=>!s.land}),
 A('will','살림','남길 것을 정리하다','재산과 부탁을 가족·공동체에 전합니다.',{bonds:8,happiness:3},{age:45}),
 A('apprentice','생업','도제로 들어갈 곳을 찾다','일을 거들며 장인의 기술을 배웁니다.',{skill:8,wealth:2},{age:12,maxAge:30}),
 A('extra','생업','품을 더 팔다','추가 일감으로 살림을 보태지만 몸이 지칩니다.',{wealth:8,health:-4,happiness:-2},{age:14}),
 A('bargain','생업','장터에서 흥정하다','물건의 가치와 사람의 마음을 익힙니다.',{skill:4,wealth:4},{age:14}),
 A('quality','생업','제품의 품질을 높이다','생업의 솜씨와 신뢰를 함께 쌓습니다.',{skill:7,reputation:3,wealth:-3},{age:16,cost:3,test:s=>!!s.job}),
 A('patron','생업','후원자를 찾아보다','실력을 보여 줄 기회를 찾습니다.',{reputation:7,bonds:3,wealth:-4},{age:18,cost:4,need:{skill:40}}),
 A('retire','생업','생업에서 물러나다','정기 수입을 멈추고 저축과 가족의 도움에 의지합니다.',{health:5,happiness:6},{age:55,test:s=>!!s.job&&!s.retired,special:'retire'}),
 A('weaving','시대','집에서 천을 짜다','가내 직조로 살림을 보탭니다.',{skill:5,wealth:4},{age:12,test:s=>s.year<1950}),
 A('guild','시대','장인 조합에 문을 두드리다','도시 조합의 견습·가입 관습을 따릅니다.',{skill:5,reputation:6,wealth:-12},{age:18,cost:12,test:s=>['west','britain'].includes(s.culture)&&s.year>=1100&&s.year<1800,need:{skill:40}}),
 A('manuscript','시대','필사 작업을 돕다','인쇄 보급 전의 책과 문서 생산에 참여합니다.',{knowledge:5,wealth:4},{age:16,literacy:true,test:s=>['west','britain','byzantium','islam'].includes(s.culture)&&s.year>=500&&s.year<1500}),
 A('caravan','시대','대상 교역에 동행하다','육상 교역의 이익과 위험을 함께 감수합니다.',{wealth:17,skill:5,health:-3},{age:18,test:s=>['islam','persia','africa','india','china'].includes(s.culture)&&s.year<1850,risk:.25,riskEffect:{wealth:-25,health:-8}}),
 A('pilgrimage','시대','순례길에 오르다','종교적 목적의 여행에는 시간과 비용이 듭니다.',{happiness:12,knowledge:5,wealth:-15,health:-3},{age:18,cost:15,test:s=>s.year>=600&&s.year<1900}),
 A('festival','시대','계절 의례에 참여하다','수확과 새 계절을 공동체와 기념합니다.',{happiness:7,bonds:5,wealth:-2},{age:8,cost:2}),
 A('petition','시대','공동체의 청원을 올리다','당대 권력자에게 마을의 고충을 전달합니다.',{reputation:6,wealth:-8},{age:25,cost:8,need:{reputation:55},special:'petition',cooldown:8}),
 A('granary','시대','공동 구휼에 힘을 보태다','개인의 자원으로 이웃의 기근 피해를 줄입니다.',{wealth:-35,reputation:12,bonds:8},{age:25,cost:35,need:{reputation:45},special:'relief',cooldown:8}),
 A('newspaper','시대','신문을 읽다','정치와 생활의 변화를 인쇄 매체로 접합니다.',{knowledge:6,wealth:-1},{age:12,cost:1,literacy:true,test:s=>(['britain','west','america'].includes(s.culture)&&s.year>=1800)||s.year>=1900}),
 A('train','시대','철도로 이웃 도시를 다녀오다','운행이 정착된 철도 노선을 이용합니다.',{knowledge:5,happiness:5,wealth:-6},{age:18,cost:6,test:s=>(['britain','west','america'].includes(s.culture)&&s.year>=1850)||s.year>=1920}),
 A('union','시대','노동자 모임에 참여하다','산업 현장의 동료들과 노동 조건을 논의합니다.',{bonds:6,reputation:4,wealth:-3},{age:18,cost:3,test:s=>s.job==='factory'&&s.year>=1880,risk:.15,riskEffect:{wealth:-10}}),
 A('radio','시대','라디오 방송을 듣다','보급된 방송에서 음악과 소식을 접합니다.',{happiness:6,knowledge:3},{age:8,test:s=>s.year>=1930}),
 A('letter','여가','편지를 쓰다','먼 사람에게 일상의 안부를 전합니다.',{bonds:6,happiness:4},{age:10,literacy:true}),
 A('draw','여가','그림을 그리다','손에 구할 수 있는 재료로 풍경을 남깁니다.',{skill:5,happiness:5},{age:6}),
 A('story','여가','이야기꾼의 공연을 듣다','당대의 설화와 재담을 즐깁니다.',{knowledge:2,happiness:6,wealth:-1},{age:6,cost:1}),
 A('music','여가','악기를 익히다','지역에서 구할 수 있는 악기를 연습합니다.',{skill:6,happiness:5,wealth:-4},{age:8,cost:4}),
 A('records','여가','내 삶을 기록하다','오늘의 사소한 일을 글로 남깁니다.',{happiness:4,knowledge:3},{age:12,literacy:true}),
 A('mentor','관계','젊은이의 길잡이가 되다','살아오며 익힌 지혜와 기술을 전합니다.',{bonds:7,reputation:6,happiness:4},{age:45})
];
export function actionReason(s,a){if(!s.alive)return '생애가 끝났습니다';if(s.age<(a.age||0))return `${a.age}세부터`;if(a.maxAge&&s.age>a.maxAge)return '시기를 지났습니다';if(a.test&&!a.test(s))return '시대·지역·생활 조건';if(a.literacy&&!s.literate)return '글을 익혀야 합니다';if(a.cost&&s.wealth<a.cost)return `살림 ${a.cost} 필요`;if(a.need)for(const[k,v]of Object.entries(a.need))if(s.stats[k]<v)return `${({knowledge:'지식',skill:'솜씨',reputation:'평판'})[k]} ${v} 필요`;if(s.cooldowns[a.id]&&s.year-s.cooldowns[a.id]<a.cooldown)return '다시 준비할 시간이 필요합니다';if(s.yearActions.includes(a.id))return '올해 이미 했습니다';if(s.ap<=0)return '올해의 활동을 모두 했습니다';return null;}
export function doAction(s,id){const a=ACTIONS.find(a=>a.id===id);if(!a||actionReason(s,a))return false;s.ap--;s.actionsTaken++;s.yearActions.push(id);s.cooldowns[id]=s.year;apply(s,a.effects);let text=a.desc;if(a.risk&&random(s)<a.risk){apply(s,a.riskEffect);text+=' 예상치 못한 어려움으로 손해를 입었습니다.';}
 if(a.special==='meet'){s.suitor=personalName(s,s.sex==='여성'?'남성':'여성');text=`${s.suitor}와 인연을 맺었습니다. 서로를 알아 가며 혼인을 결정할 수 있습니다.`;}
 if(a.special==='marry'){s.partner={name:s.suitor,age:s.age+range(s,-3,5)};s.suitor=null;text=`${s.partner.name}와 새 살림을 꾸립니다. 결혼 뒤의 삶도 두 사람이 함께 만들어 갑니다.`;}
 if(a.special==='child')text=child(s);
 if(a.special==='separate'){text=`${s.partner.name}와 살림을 나누기로 했습니다. 기존 자녀와의 관계는 계속됩니다.`;s.partner=null;}
 if(a.special==='rural')s.location='농촌';if(a.special==='urban')s.location='도시';if(a.special==='land')s.land=true;if(a.special==='retire')s.retired=true;
 if(['petition','relief'].includes(a.special)){const success=random(s)<(s.stats.reputation/140+.2);if(success){s.branches.push({year:s.year,title:a.special==='relief'?'마을의 구휼 창고':'마을의 청원 수용'});s.relief=true;text+=' 노력이 결실을 맺었습니다. 이 마을에서는 기록된 역사와 다른 작은 변화가 시작됩니다.';}else text+=' 이번에는 충분한 지지와 허락을 얻지 못했습니다.';}
 log(s,'action',a.title,text);return true;}
function child(s){if(random(s)>.7)return '바람과 달리 아직 아이 소식은 없습니다. 다음 기회를 기다립니다.';const name=personalName(s,pick(s,['여성','남성']));s.children.push({name,born:s.year,alive:true});if(s.year<1900&&random(s)<.1){apply(s,{health:s.sex==='여성'?-25:-8,happiness:-10});return `${name}${post(name,'이','가')} 태어났습니다. 산후의 어려움으로 가족이 긴 간병을 하고 있습니다.`;}apply(s,{happiness:10,bonds:8});return `아이 ${name}${post(name,'이','가')} 태어났습니다. 작은 울음소리가 집 안을 채웁니다.`;}
const choice=(label,desc,effects={},special)=>({label,desc,effects,special});
function historyEvent(s,h){const childAge=s.age<14;return {title:h.title,kicker:'역사가 일상에 닿을 때',text:h.text+' 세계의 큰 흐름 속에서도 당신이 지킬 것은 가까운 삶입니다.',historical:true,choices:childAge?[choice('가족 곁에 머문다','어른들의 돌봄을 받으며 기다립니다.',{bonds:5,health:2}),choice('이웃과 함께 지낸다','가까운 사람들과 의지합니다.',{bonds:7,happiness:2})]:[choice('가족의 안전을 먼저 챙긴다','생업을 줄이고 가까운 사람을 돌봅니다.',{bonds:9,wealth:-5,health:3}),choice('생업을 이어 간다','위험을 감수하고 살림을 지킵니다.',{wealth:10,health:-6,skill:3}),choice('이웃과 서로 돕는다','식량과 소식을 함께 나눕니다.',{bonds:7,reputation:6,wealth:-4}),choice('다른 거처를 알아본다','밑천이 있다면 같은 지역 안에서 옮깁니다.',{wealth:-12,health:5},'move')]};}
export function makeEvent(s){
 if(s.age===3)return{title:'마당 너머가 궁금한 나이',kicker:'유년 · 첫 번째 기억',text:`집 안에는 ${CULTURES[s.culture].food} 냄새가 납니다. 말과 걸음이 익숙해지자, 당신의 작은 세계가 조금씩 넓어집니다.`,choices:[choice('가족의 이야기에 귀를 기울인다','말과 관계를 배우는 시간',{knowledge:4,bonds:6}),choice('마당에서 몸을 움직인다','호기심과 함께 자라는 몸',{health:5,happiness:5}),choice('손에 잡히는 물건을 살펴본다','작은 손끝으로 배우는 세상',{skill:5,knowledge:2})]};
 if(s.age===6)return{title:'무엇을 배우며 자랄까요?',kicker:'유년 · 배움의 시작',text:`${s.origin}의 형편 안에서 배움의 길을 찾습니다. 이 시대에는 누구나 같은 교육을 받을 수 있는 것이 아닙니다.`,choices:[choice('집안일을 도우며 배운다','살아가는 기술과 가족의 신뢰',{skill:7,bonds:5}),choice('글 아는 이에게 부탁한다','작은 비용으로 시작하는 글 공부',{knowledge:10,wealth:-3}),choice('또래들과 마을을 탐험한다','튼튼한 몸과 가까운 친구',{health:5,bonds:6,happiness:4}),choice('이야기와 노래를 기억한다','귀로 이어지는 지식',{knowledge:4,skill:4,happiness:5})]};
 if(s.age===12)return{title:'작은 손에도 일이 주어집니다',kicker:'소년기 · 집안의 한 사람',text:`당신도 집안의 일손을 보태기 시작했습니다. ${CULTURES[s.culture].market}의 소리, 땀 냄새, 익숙한 사람들. 어떤 일에 마음이 기우나요?`,choices:[choice('논밭 일을 거든다','몸을 쓰고 계절을 배웁니다.',{health:4,skill:6,wealth:3}),choice(`${CULTURES[s.culture].craft}를 배운다`,'손기술을 차근차근 익힙니다.',{skill:10,wealth:2}),choice('장터에서 셈을 돕는다','거래와 숫자를 눈에 익힙니다.',{knowledge:6,skill:5,wealth:2}),choice('배움의 시간을 더 부탁한다','일손 대신 공부에 시간을 씁니다.',{knowledge:12,wealth:-4})]};
 if(s.age===16)return{title:'나의 몫을 찾아서',kicker:'청년기 · 생업의 문턱',text:'가족의 울타리 너머에서 살아갈 방법을 고민합니다. 아래 생업 목록에서 조건에 맞는 일을 직접 고를 수도 있습니다.',choices:[choice('먼저 손기술을 더 익힌다','일을 시작할 밑바탕을 마련합니다.',{skill:10}),choice('글과 셈에 힘을 쏟는다','문서와 장부를 다룰 준비를 합니다.',{knowledge:10}),choice('당장 품을 판다','큰 준비 없이 몸으로 일합니다.',{wealth:8,health:-2},'labor'),choice('가족 곁에서 농사를 돕는다','익숙한 생업을 이어 갑니다.',{skill:5,bonds:5},'farm')]};
 if(s.age===20&&!s.partner)return{title:'누군가와 삶을 나눈다는 것',kicker:'청년기 · 인연',text:'가족과 이웃이 혼인 이야기를 꺼냅니다. 당대의 관습과 살림 형편은 선택의 폭을 좁히기도 합니다. 혼인하지 않는 삶도 이어 갈 수 있습니다.',choices:[choice('소개받을 사람을 만나 본다','만남 뒤에 혼인을 결정합니다.',{bonds:5},'meet'),choice('지금은 생업이 먼저다','살림의 기반을 다집니다.',{skill:5,wealth:5}),choice('혼자 사는 삶을 생각한다','자기만의 시간을 지킵니다.',{happiness:6}),choice('가족과 천천히 상의한다','곁에 있는 이들의 말을 듣습니다.',{bonds:8})]};
 if(s.age===60&&!s.retired)return{title:'손에 익은 일을 내려놓을 때',kicker:'노년 · 남은 계절',text:'살아온 시간만큼 몸의 피로가 쌓였습니다. 앞으로 어떤 속도로 살아갈까요?',choices:[choice('일을 줄이고 쉬기로 한다','수입이 멈추는 대신 몸을 돌봅니다.',{health:8,happiness:5},'retire'),choice('아직은 일을 이어 간다','평생 익힌 솜씨로 살림을 보탭니다.',{wealth:8,health:-3}),choice('배운 것을 다음 세대에 전한다','당신의 경험이 누군가의 시작이 됩니다.',{reputation:8,bonds:7})]};
 const pool=[
 {title:'뜻밖에 생긴 여유',kicker:'일상 · 작은 선택',text:'해야 할 일을 마치고 조금의 시간이 남았습니다. 누구에게나 하루는 같지만, 하루를 채우는 방법은 다릅니다.',choices:[choice('몸을 쉬게 한다','내일을 위해 쉬어 갑니다.',{health:7}),choice('새로운 솜씨를 익힌다','작은 반복이 기술이 됩니다.',{skill:7,knowledge:2}),choice('가까운 이와 시간을 나눈다','이야기 속에서 마음이 가까워집니다.',{bonds:7,happiness:4}),choice('내일 쓸 것을 준비한다','살림을 알뜰하게 꾸립니다.',{wealth:5,skill:2})]},
 {title:'이웃집에 일손이 필요합니다',kicker:'관계 · 함께 살아가기',text:'아는 이웃이 도움을 청해 왔습니다. 당신도 넉넉하지는 않지만, 마을은 서로의 손을 빌리며 살아갑니다.',choices:[choice('기꺼이 돕는다','몸은 힘들어도 인연이 남습니다.',{bonds:9,reputation:5,health:-2}),choice('작은 먹거리를 나눈다','할 수 있는 만큼 보탭니다.',{wealth:-3,bonds:6}),choice('사정을 말하고 쉬기로 한다','오늘의 건강도 소중합니다.',{health:4,bonds:-2}),choice('도울 사람을 함께 찾는다','사람과 사람을 연결합니다.',{knowledge:2,bonds:5,reputation:3})]},
 {title:'장터에서 눈에 든 물건',kicker:'살림 · 필요한 것과 원하는 것',text:`${CULTURES[s.culture].market}에 낯선 물건이 들어왔습니다. 오래 바라보는 당신에게 상인이 말을 건넵니다.`,choices:[choice('생활에 쓸 도구를 고른다','손에 익히면 일을 돕습니다.',{wealth:-5,skill:6}),choice('가족에게 줄 것을 산다','작은 물건에 마음을 담습니다.',{wealth:-4,bonds:7,happiness:3}),choice('물건에 얽힌 이야기를 듣는다','새로운 지역의 생활을 배웁니다.',{knowledge:5}),choice('구경만 하고 돌아온다','오늘은 살림을 지킵니다.',{happiness:3})]},
 {title:'몸이 보내는 작은 신호',kicker:'건강 · 돌봄',text:'며칠째 몸이 무겁고 쉽게 지칩니다. 이 시대의 치료에는 한계가 있지만, 무리하지 않는 선택을 할 수는 있습니다.',choices:[choice('일을 줄이고 쉰다','수입보다 회복을 먼저 생각합니다.',{health:10,wealth:-3}),choice('지역 치료사를 찾는다','당대의 지식에 기대어 봅니다.',{health:5,wealth:-5}),choice('음식과 잠을 챙긴다','작은 습관을 바꿉니다.',{health:6,happiness:2,wealth:-2}),choice('해야 할 일을 계속한다','살림을 보태지만 몸이 지칩니다.',{wealth:5,health:-8})]}
 ];
 if(s.age<14)return pick(s,pool.slice(0,2));
 if(s.partner)pool.push({title:'같은 지붕 아래 서로 다른 마음',kicker:'가족 · 둘이 꾸리는 삶',text:`${s.partner.name}와 살림 문제로 말이 엇갈렸습니다. 함께 산다고 언제나 같은 마음인 것은 아닙니다.`,choices:[choice('상대의 말을 끝까지 듣는다','시간을 들여 서로를 이해합니다.',{bonds:10,happiness:3}),choice('함께 할 일을 찾아본다','작은 일부터 다시 맞춥니다.',{bonds:7,skill:3}),choice('당분간 혼자만의 시간을 갖는다','거리를 두고 마음을 가라앉힙니다.',{happiness:5,bonds:-3}),choice('생활 계획을 다시 세운다','살림의 부담을 함께 나눕니다.',{wealth:5,bonds:4})]});
 if(s.children.length)pool.push({title:'아이의 내일을 생각합니다',kicker:'가족 · 이어지는 삶',text:'자라나는 아이에게 무엇을 물려줄 수 있을까요? 재산보다 오래 남는 것도 있을지 모릅니다.',choices:[choice('배움에 조금 더 보탠다','아이의 길을 넓혀 줍니다.',{wealth:-6,bonds:8,happiness:4}),choice('내가 아는 일을 가르친다','생업의 솜씨와 기억을 나눕니다.',{bonds:7,skill:3}),choice('아이가 원하는 이야기를 듣는다','앞날을 함께 생각합니다.',{bonds:10,happiness:3})]});
 if(s.job)pool.push({title:'익숙한 일, 새로운 갈림길',kicker:'생업 · 일의 무게',text:`${status(s)}의 일에 조금씩 능숙해졌습니다. 더 많은 품을 팔지, 솜씨를 다듬을지 고민하게 됩니다.`,choices:[choice('일감을 더 맡는다','수입을 늘리는 대신 몸이 지칩니다.',{wealth:12,health:-5}),choice('실력을 다듬는다','멀리 보며 천천히 배웁니다.',{skill:9,wealth:-2}),choice('동료와 지식을 나눈다','서로의 손길에서 배웁니다.',{bonds:6,skill:5,reputation:3}),choice('지금의 속도를 지킨다','익숙한 일상도 충분합니다.',{happiness:5,health:3})]});
 if(s.age>=40)pool.push({title:'지나온 길을 돌아보며',kicker:'성년 · 삶의 무늬',text:'젊을 적의 바람과 지금의 일상은 조금 다릅니다. 그래도 당신이 만들어 온 삶은 오직 당신의 것입니다.',choices:[choice('오래된 친구를 찾는다','세월을 함께 떠올립니다.',{bonds:8,happiness:6}),choice('작은 즐거움을 새로 배운다','배움에 늦은 때는 없습니다.',{skill:6,happiness:6}),choice('가족에게 옛이야기를 들려준다','기억이 다음 세대로 이어집니다.',{bonds:9,reputation:3})]});
 pool.push(...PERSONAL_EVENTS.filter(e=>e.test(s)).map(({test,...e})=>e));
 return pick(s,pool);
}
export function choose(s,index){if(!s.alive||!s.pending)return false;const event=s.pending,c=event.choices[index];if(!c)return false;if((c.effects.wealth||0)<0&&s.wealth<Math.abs(c.effects.wealth))return false;apply(s,c.effects);if(['farm','labor'].includes(c.special))s.job=c.special;if(c.special==='meet')s.suitor=personalName(s,s.sex==='여성'?'남성':'여성');if(c.special==='move')s.location=s.location==='농촌'?'작은 도시':'농촌';if(c.special==='retire')s.retired=true;log(s,'choice',c.label,`${event.title} — ${c.desc}${c.special==='meet'?` ${s.suitor}와 인연을 맺었습니다.`:''}`);s.pending=null;return true;}
export function takeJob(s,id){const j=JOBS.find(j=>j.id===id);if(!s.alive||!j||canJob(s,j)||s.ap<=0||s.age<14)return false;s.job=id;s.retired=false;s.ap--;s.actionsTaken++;s.wealth-=j.cost||0;log(s,'career',`${j.name}의 길을 걷다`,j.desc+' 수입은 솜씨와 생활 집중에 따라 해마다 달라집니다.');return true;}
function die(s,cause){s.alive=false;s.pending=null;s.cause=cause;log(s,'death',`${s.age}년의 이야기를 마치다`,`${s.name}의 삶이 ${s.year}년에 끝났습니다. ${cause} 승패로 셀 수 없는 한 사람의 시간이 이곳에 남습니다.`);sample(s);}
export function tick(s){if(!s.alive||s.pending)return false;s.age++;s.year++;s.ap=2;s.yearActions=[];s.stats.health=clamp(s.stats.health-(s.age>55?1.5:s.age>35?.6:.12));apply(s,FOCUSES.find(f=>f.id===s.focus).effect);if(s.age<14){apply(s,{knowledge:.8,skill:.7,health:.5});}s.income=income(s);s.expense=spending(s);const net=s.income-s.expense+(s.land?6:0);s.wealth=Math.max(0,s.wealth+net);if(s.age>=14&&s.wealth===0&&net<0)apply(s,{health:-3,happiness:-2});
 if(s.partner){s.partner.age++;if(s.partner.age>65&&random(s)<.025){log(s,'family','함께한 사람을 떠나보내다',`${s.partner.name}가 세상을 떠났습니다. 함께했던 시간은 기억에 남습니다.`);s.partner=null;apply(s,{happiness:-18,bonds:-5});}}
 for(const c of s.children){const a=s.year-c.born;if(c.alive&&a<5&&random(s)<(s.year<1900?.025:.003)){c.alive=false;log(s,'family','작은 생명을 떠나보내다',`아이 ${c.name}가 병을 이기지 못했습니다. 가족은 서로를 붙잡으며 슬픔을 견딥니다.`);apply(s,{happiness:-20});}if(c.alive&&a===16){log(s,'family','아이가 자기 길을 찾습니다',`${c.name}가 자라 생업을 배우기 시작했습니다.`);apply(s,{happiness:8,bonds:5});}}
 const current=POLITIES.find(p=>p.name===s.polity&&p.culture===s.culture&&p.start<=s.year&&p.end>=s.year);const p=current||POLITIES.find(p=>p.culture===s.culture&&p.start<=s.year&&p.end>=s.year);if(p&&p.name!==s.polity){const old=s.polity;s.polity=p.name;s.currency=p.currency;log(s,'history','시대의 이름이 바뀌어도',`${old}에서 ${p.name} 시기의 지역사로 넘어갑니다. 광역 지역 단위의 전환이며 정확한 국경 이동은 재현하지 않습니다.`);}else if(!p&&!s.polity.endsWith('지역')){s.polity=CULTURES[s.culture].name+' 지역';log(s,'history','새로운 시대의 경계에서','이 지역의 지배 질서가 변했습니다. 세부 정치사는 수록 범위 밖이지만 당신의 삶은 이어집니다.');}
 const h=HISTORIES.find(h=>h.year===s.year&&h.regions.includes(s.culture));if(h){s.history.push(h);log(s,'history',h.title,h.text);if(['plague','war','famine','fire'].includes(h.kind)){apply(s,{health:s.relief?-3:-9,wealth:s.relief?-2:-6,happiness:-4});s.hazard=3;}s.pending=historyEvent(s,h);}
 const base=s.year<1800?.004:s.year<1950?.002:.001;let risk=base+(s.age<5?(s.year<1900?.014:.002):0)+(s.age>50?Math.pow((s.age-50)/55,3)*.11:0)+(s.stats.health<25?.05:s.stats.health<40?.015:0)+(s.hazard>0?.009:0)+(s.job==='soldier'?.003:0);if(s.focus==='health')risk*=.75;if(s.hazard>0)s.hazard--;
 if(s.stats.health<=0||s.age>=110||random(s)<risk){die(s,s.age>65?'긴 세월 끝에 마지막 숨을 거두었습니다.':s.stats.health<30?'오랫동안 쇠약해진 몸이 더는 버티지 못했습니다.':'당대에 치료하기 어려웠던 갑작스러운 병이 찾아왔습니다.');return true;}
 if(!s.pending&&([3,6,9,12,16,20,25,30,40,50,60,70,80].includes(s.age)||(s.age>=14&&s.age%3===0)))s.pending=makeEvent(s);
 if(s.age%1===0&&!s.pending)log(s,'year',s.age<3?'작고 느린 성장':s.age<14?'세상을 조금 더 배우다':'익숙한 하루들이 쌓이다',s.age<3?'주위의 손길을 받으며 자랐습니다. 아직 선택할 수 없는 시간에도 삶은 흐릅니다.':s.income?`${status(s)}의 일로 ${s.income} 살림 단위를 벌고 ${s.expense} 단위를 생활에 썼습니다.`:'가까운 사람들과 생활을 이어 갑니다.');
 sample(s);return true;}
