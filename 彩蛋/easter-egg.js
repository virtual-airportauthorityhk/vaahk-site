// 彩蛋数据 - 正能量句子和抽象句子
const eggMessages = {
    // 正能量句子 - 用于主页展示
    positive: [
        {
            message: "记住每天保持微笑，Tomorrow everything will be fine.",
            author: "影云烁"
        },
        {
            message: "虚拟香港管理局在虚航有着一定的基础发展，为虚航提高了水平，有着稳定的系统和人员。",
            author: "荔椿🍋·Lichee"
        },
        {
            message: "永远相信明天会更美好",
            author: "▁倔强こ男孩う"
        },
        {
            message: "快乐不会因分享而减半，反而会像一粒石子投入湖心，荡开层层叠叠的涟漪。你的一个故事，能唤醒他人一段记忆；你的一缕微光，或许正照亮着别人的夜空。当我们彼此敞开，便不再是孤立的岛屿，而是在共鸣中，让各自的宇宙都变得更为辽阔。",
            author: "（收割者）祥入"
        },
        {
            message: "真正的勇敢，不是从不害怕，而是带着恐惧依然前行。是敢在人群中说'不'，敢在跌倒后爬起来，敢亲手缝合那个破碎的心。你不必向任何人证明你的强大，你只需要在每个脆弱来袭的深夜，为自己点一盏不灭的灯。",
            author: "（收割者）祥入"
        },
        {
            message: "别再习惯性地把自己放在最后一位。你的感受、你的时间、你的梦想、你的边界，都值得被郑重对待和用心守护。对自己温柔一点，这不是自私，而是对生命最基本的尊重与热爱。",
            author: "（收割者）祥入"
        },
        {
            message: "假的就是假的，真的就是真的，假的永远代替不了真的。",
            author: "邵禾渊"
        },
        {
            message: "虚拟并非现实，记住假的永远都是假的，他永远也不可能代替真的。",
            author: "邵禾渊"
        },
        {
            message: "逐梦蓝天，为梦奔赴",
            author: "月月星耀"
        },
        {
            message: "九死未毁的我能否唤醒你 迎接那黎明",
            author: "YA-2331"
        },
        {
            message: "世界上最幸福的事情只有两件事，饱餐与被爱",
            author: "我是之悦喵"
        },
        {
            message: "以热爱为翼，赴每一场山海之约。",
            author: "寒暮"
        },
        {
            message: "With love as the wing, go to every appointment between mountains and seas.",
            author: "寒暮"
        },
        {
            message: "以玫瑰之名，护你周全。",
            author: "邵卿墨"
        },
        {
            message: "万物皆有灵，信不信随你。",
            author: "邵卿墨"
        },
        {
            message: "真话有点残忍，假话过于假，我建议听真话",
            author: "邵卿墨"
        },
        {
            message: "尽管撒旦惧怕阳光，但是在天国的夜空中，总有一颗闪耀的明星属于撒旦。",
            author: "狞笑者"
        },
        {
            message: "爱是假的所以去爱世界吧",
            author: "电音汽水"
        },
        {
            message: "生活就像骑自行车，想要保持平衡，就必须不断前进。",
            author: "爱因斯坦"
        },
        {
            message: "成功的秘诀在于对目标的执着追求。",
            author: "本杰明·迪斯雷利"
        },
        {
            message: "不要等待机会，而要创造机会。",
            author: "乔治·伯纳德·肖"
        },
        {
            message: "相信你自己，然后别人才会相信你。",
            author: "屠格涅夫"
        },
        {
            message: "人生没有彩排，每一天都是现场直播。",
            author: "俗语"
        },
        {
            message: "天空黑暗到一定程度，星辰就会熠熠生辉。",
            author: "查尔斯·A·比尔德"
        },
        {
            message: "今天能做到的事，不要拖到明天。",
            author: "本杰明·富兰克林"
        },
        {
            message: "梦想不会逃跑，逃跑的永远是自己。",
            author: "宫崎骏"
        },
        {
            message: "生活不是等待风暴过去，而是学会在雨中跳舞。",
            author: "维维安·格林"
        },
        {
            message: "你的时间有限，所以不要为别人而活。",
            author: "史蒂夫·乔布斯"
        },
        {
            message: "成功的花，人们只惊羡她现时的明艳！然而当初她的芽儿，浸透了奋斗的泪泉，洒遍了牺牲的血雨。",
            author: "冰心"
        },
        {
            message: "山不过来，我就过去。",
            author: "穆罕默德"
        },
        {
            message: "人生最重要的不是所处的位置，而是所朝的方向。",
            author: "李开复"
        },
        {
            message: "每一个不曾起舞的日子，都是对生命的辜负。",
            author: "尼采"
        },
        {
            message: "世界上只有一种真正的英雄主义，那就是在认识生活的真相后依然热爱生活。",
            author: "罗曼·罗兰"
        },
        {
            message: "生活就像一盒巧克力，你永远不知道下一块会是什么味道。",
            author: "《阿甘正传》"
        },
        {
            message: "不要因为走得太远，忘了我们为什么出发。",
            author: "纪伯伦"
        },
        {
            message: "心有猛虎，细嗅蔷薇。",
            author: "西格夫里·萨松"
        },
        {
            message: "岁月不居，时节如流。",
            author: "孔融"
        },
        {
            message: "实现不可能的唯一方法就是相信它是可能的。",
            author: "《爱丽丝梦游仙境》"
        },
        {
            message: "相信自己能做到，你就已经成功了一半。",
            author: "西奥多·罗斯福"
        },
        {
            message: "不要走别人铺好的路，而是走别人没有走过的路，留下自己的足迹。",
            author: "佚名"
        },
        {
            message: "信心、毅力、勇气三者具备，则天下没有做不成的事。",
            author: "佚名"
        },
        {
            message: "人生最大的成就，是从失败中站起来。",
            author: "佚名"
        },
        {
            message: "成功不是终点，失败也不是致命的，重要的是继续前行的勇气。",
            author: "温斯顿·丘吉尔"
        },
        {
            message: "幸福不是现成的东西，它来自于你的行动。",
            author: "佚名"
        },
        {
            message: "我们最大的敌人不是别人可能是自己。",
            author: "佚名"
        },
        {
            message: "长风破浪会有时，直挂云帆济沧海。",
            author: "李白"
        },
        {
            message: "天生我材必有用，千金散尽还复来。",
            author: "李白"
        },
        {
            message: "会当凌绝顶，一览众山小。",
            author: "杜甫"
        },
        {
            message: "路漫漫其修远兮，吾将上下而求索。",
            author: "屈原"
        },
        {
            message: "海内存知己，天涯若比邻。",
            author: "王勃"
        },
        {
            message: "天空没有极限，正如你的潜力无限。",
            author: "佚名"
        },
        {
            message: "每一次飞行都是对梦想的追逐",
            author: "佚名"
        },
        {
            message: "在虚拟的天空中，我们创造真实的友谊和难忘的回忆。",
            author: "佚名"
        },
        {
            message: "航空不仅是一种技术，更是一种连接人心的艺术。",
            author: "佚名"
        },
        {
            message: "梦想如飞机引擎，一旦启动就无法停止。让我们一起飞向更远的地方！",
            author: "佚名"
        },
        {
            message: "在模拟飞行的世界里，每个人都可以成为自己人生的机长。",
            author: "佚名"
        },
        {
            message: "耐心和细致是飞行的基石，也是成功的密码。",
            author: "佚名"
        },
        {
            message: "无论风雨，我们始终在虚拟的天空中为你护航。",
            author: "佚名"
        },
        {
            message: "每一次安全的起降，都是团队协作的完美体现。",
            author: "佚名"
        },
        {
            message: "飞机是凝聚了人类智慧与勇气的伟大发明。",
            author: "莱特兄弟"
        },
        {
            message: "飞行教会我们从一个全新的角度看待世界。",
            author: "理查德·巴赫"
        },
        {
            message: "机场比婚礼殿堂见证了更多真挚的吻，医院的墙比教堂听到了更多的祈祷。",
            author: "佚名"
        },
        {
            message: "真正的发现之旅不在于寻找新风景，而在于拥有新的眼光。",
            author: "马塞尔·普鲁斯特"
        },
        {
            message: "我们不是因为变老而停止飞行，我们是因为停止飞行而变老。",
            author: "奥维尔·莱特"
        },
        {
            message: "飞行不是一种爱好，而是一种生活方式。",
            author: "虚拟香港机场管理局 VAAHK"
        },
        {
            message: "在云端，我们找到了真正的自由。",
            author: "虚拟香港机场管理局 VAAHK"
        },
        {
            message: "每一次起飞都是新的开始，每一次降落都是圆满的结束。",
            author: "虚拟香港机场管理局 VAAHK"
        },
        {
            message: "民用航空器的极限是45000英尺，但我们的梦想没有极限",
            author: "虚拟香港机场管理局 VAAHK"
        }
    ],
    
    // 抽象句子 - 用于彩蛋功能
    abstract: [
        {
            message: "古顾菇~",
            author: "超骑的MC世界"
        },
        {
            message: "本人已死，有事烧纸；小事招魂，大事挖坟；偷我贡品，死了没坟。",
            author: "电音汽水"
        },
        {
            message: "我家旁边有棵树，我是废物你记住。",
            author: "秋樹"
        },
        {
            message: "影宝宝！",
            author: "CZ8042"
        },
        {
            message: "f**k you every day!",
            author: "CZ3705"
        },
        {
            message: "厚如我🥵🥵🥵",
            author: "da_bian❂"
        },
        {
            message: "南娘是CZ1930",
            author: "WENSLEYCHING."
        },
        {
            message: "南凉是CZ6902",
            author: "CZ3705"
        },
        {
            message: "那78不是啊",
            author: "狞笑者"
        },
        {
            message: "老子明天就写报纸污蔑你们",
            author: "冒充者"
        },
        {
            message: "我怕他搞我啊",
            author: "少爷"
        },
        {
            message: "我直接给你航司查封",
            author: "虚拟南航集团董事长"
        },
        {
            message: "重庆航空宣布倒闭",
            author: "DerTigerTyp"
        },
        {
            message: "别干了和我干",
            author: "佚名"
        },
        {
            message: "打断加一死全家",
            author: "某连飞平台"
        },
        {
            message: "我没有浮木",
            author: "Simple阿葉"
        },
        {
            message: "对吧?",
            author: "寒暮"
        },
        {
            message: "有啥问题？有问题都得给我憋着。",
            author: "心瘾^"
        },
        {
            message: "那龙局他妈的死哪去了",
            author: "DY承仔"
        },
        {
            message: "东水卿月不在我就是无敌的",
            author: "泠灀💫lingshuang420"
        },
        {
            message: "我在考虑要不要发给主席看",
            author: "汐玥玥玥喵～"
        }
    ]
};

// 导出供其他文件使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = eggMessages;
}