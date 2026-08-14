-- =============================================================================
-- 芒寶答案卡（ChatbotCard）
--
-- 用途：讓基金會人員可在後台自行維護聊天機器人的回答。
--       回覆文字固定由人撰寫，機器只負責挑選卡片，因此語氣不會隨模型生成而改變。
--
-- 對應程式：
--   後台維護 API  iFare_Backend_API  ChatbotCardAppService
--   前台唯讀 API  iFare_Frontend_API ChatbotCardAppService.GetEnabledCards
--   前台比對邏輯  iFare_Frontend     server/utils/chatbot/
--
-- 注意：State 使用專案既有的中文常數（DataState.cs）：啟用 / 停用 / 刪除
--       刪除為軟刪除，不會實際移除資料列。
--
-- 產生日期：2026-08-12
-- =============================================================================

IF OBJECT_ID(N'dbo.ChatbotCard', N'U') IS NOT NULL
BEGIN
    PRINT N'ChatbotCard 資料表已存在，略過建立。';
END
ELSE
BEGIN
    CREATE TABLE dbo.ChatbotCard
    (
        ID              bigint          IDENTITY(1,1) NOT NULL,
        CardKey         nvarchar(64)    NOT NULL,
        Title           nvarchar(100)   NOT NULL,
        Keywords        nvarchar(max)   NOT NULL,
        Answer          nvarchar(max)   NOT NULL,
        LinkKeys        nvarchar(200)   NULL,
        Priority        decimal(3,2)    NOT NULL CONSTRAINT DF_ChatbotCard_Priority   DEFAULT ((1.00)),
        Sort            int             NOT NULL CONSTRAINT DF_ChatbotCard_Sort       DEFAULT ((0)),
        State           nvarchar(20)    NOT NULL CONSTRAINT DF_ChatbotCard_State      DEFAULT (N'停用'),
        CreateTime      datetime        NOT NULL CONSTRAINT DF_ChatbotCard_CreateTime DEFAULT (getdate()),
        UpdateTime      datetime        NULL,
        CreateUser_ID   bigint          NULL,
        UpdateUser_ID   bigint          NULL,
        CONSTRAINT PK_ChatbotCard PRIMARY KEY CLUSTERED (ID ASC),
        CONSTRAINT FK_ChatbotCard_SysUser  FOREIGN KEY (CreateUser_ID) REFERENCES dbo.SysUser (ID),
        CONSTRAINT FK_ChatbotCard_SysUser1 FOREIGN KEY (UpdateUser_ID) REFERENCES dbo.SysUser (ID)
    );

    -- 卡片代號是前台的識別碼，重複會導致選卡結果不可預期
    CREATE UNIQUE INDEX IX_ChatbotCard_CardKey ON dbo.ChatbotCard (CardKey ASC);

    PRINT N'ChatbotCard 資料表建立完成。';
END
GO

-- -----------------------------------------------------------------------------
-- 初始資料：由原本硬編碼在程式裡的兩份知識庫合併去重而來
--   iFare_Frontend/server/api/chatbot.post.ts   KNOWLEDGE_BASE（22 條）
--   iFare_Frontend/components/CompChatbotWelcome.vue  searchIntents（24 條）
-- 人稱已統一為「您」，並移除「可前往⋯查看更多內容」等公文句型（站內連結改用按鈕呈現）。
--
-- 可重複執行：以 CardKey 判斷，已存在的卡片不會被覆蓋，避免蓋掉人工修改過的內容。
-- -----------------------------------------------------------------------------

IF NOT EXISTS (SELECT 1 FROM dbo.ChatbotCard WHERE CardKey = N'greeting')
    INSERT INTO dbo.ChatbotCard (CardKey, Title, Keywords, Answer, LinkKeys, Priority, Sort, State)
    VALUES (N'greeting', N'打招呼與芒寶能做什麼', N'你好,您好,嗨,哈囉,hello,hi,能做什麼,可以問什麼,你是誰,芒寶', N'嗨，我是芒寶！我可以介紹本站每個頁面的用途，也會說明搜尋、篩選、清空、選單跟分頁這些按鈕怎麼用。', N'', 1.00, 10, N'啟用');

IF NOT EXISTS (SELECT 1 FROM dbo.ChatbotCard WHERE CardKey = N'site-overview')
    INSERT INTO dbo.ChatbotCard (CardKey, Title, Keywords, Answer, LinkKeys, Priority, Sort, State)
    VALUES (N'site-overview', N'網站整體導覽', N'網站,網頁,導覽,首頁,怎麼用,使用方式,如何使用,小幫手,長穩基金會', N'本站有「關於長穩」、「最新消息」、「福利專欄」、「公益夥伴」跟「i-Fare」五個區域。您可以問我某個頁面在哪，或哪個按鈕怎麼用。', N'about,ifare', 0.82, 20, N'啟用');

IF NOT EXISTS (SELECT 1 FROM dbo.ChatbotCard WHERE CardKey = N'menu')
    INSERT INTO dbo.ChatbotCard (CardKey, Title, Keywords, Answer, LinkKeys, Priority, Sort, State)
    VALUES (N'menu', N'網站主選單', N'主選單,選單,導覽列,手機選單,漢堡選單,導覽按鈕,頁籤', N'電腦版的頁面選單在畫面最上方；手機版按右上角的選單按鈕就會展開。裡面可以直接到關於長穩、最新消息、福利專欄、公益夥伴跟 i-Fare。', N'home', 1.00, 30, N'啟用');

IF NOT EXISTS (SELECT 1 FROM dbo.ChatbotCard WHERE CardKey = N'ifare-search')
    INSERT INTO dbo.ChatbotCard (CardKey, Title, Keywords, Answer, LinkKeys, Priority, Sort, State)
    VALUES (N'ifare-search', N'i-Fare 搜尋按鈕', N'搜尋按鈕,怎麼搜尋,如何搜尋,政策搜尋,搜尋福利,找福利,找補助,查補助,福利政策,補助,申請資格,關鍵字', N'找福利政策就到 i-Fare 頁面！先選需要的條件或輸入關鍵字，再按右側的「搜尋」。沒有關鍵字也能搜，系統會依您選的條件整理站內政策。', N'ifare', 1.00, 40, N'啟用');

IF NOT EXISTS (SELECT 1 FROM dbo.ChatbotCard WHERE CardKey = N'ifare-filter')
    INSERT INTO dbo.ChatbotCard (CardKey, Title, Keywords, Answer, LinkKeys, Priority, Sort, State)
    VALUES (N'ifare-filter', N'i-Fare 篩選條件', N'篩選,受助者情況,年齡區間,戶籍地,經濟條件,特殊身分,下拉,選項', N'在 i-Fare 搜尋區可以先選「受助者情況」、「年齡區間」跟「戶籍地」。想再細一點就按「篩選」，挑經濟條件或特殊身分，最後按「搜尋」看結果。', N'ifare', 1.00, 50, N'啟用');

IF NOT EXISTS (SELECT 1 FROM dbo.ChatbotCard WHERE CardKey = N'ifare-clear')
    INSERT INTO dbo.ChatbotCard (CardKey, Title, Keywords, Answer, LinkKeys, Priority, Sort, State)
    VALUES (N'ifare-clear', N'清空搜尋條件', N'清空,清除,重設,取消篩選,清掉條件', N'在 i-Fare 搜尋區按「清空」，受助者情況、年齡、戶籍地、關鍵字跟進階篩選會一次全部清掉，可以重新選過。', N'ifare', 1.00, 60, N'啟用');

IF NOT EXISTS (SELECT 1 FROM dbo.ChatbotCard WHERE CardKey = N'ifare-result')
    INSERT INTO dbo.ChatbotCard (CardKey, Title, Keywords, Answer, LinkKeys, Priority, Sort, State)
    VALUES (N'ifare-result', N'i-Fare 搜尋結果', N'搜尋結果,結果頁,政策列表,政策內容,政策詳情,詳細內容,第一筆', N'搜尋完，下面就會列出符合條件的政策，每筆會寫政策名稱、適用地區跟資格限制。點政策名稱看完整內容；結果太多的話，回上面多加幾個篩選條件會更準。', N'ifare', 1.00, 70, N'啟用');

IF NOT EXISTS (SELECT 1 FROM dbo.ChatbotCard WHERE CardKey = N'pagination')
    INSERT INTO dbo.ChatbotCard (CardKey, Title, Keywords, Answer, LinkKeys, Priority, Sort, State)
    VALUES (N'pagination', N'分頁與換頁', N'分頁,下一頁,上一頁,頁碼,換頁', N'資料超過一頁時，列表下方會出現頁碼跟上一頁、下一頁按鈕。點了會換頁，您原本設定的搜尋條件都會留著。', N'', 1.00, 80, N'啟用');

IF NOT EXISTS (SELECT 1 FROM dbo.ChatbotCard WHERE CardKey = N'ifare-platform')
    INSERT INTO dbo.ChatbotCard (CardKey, Title, Keywords, Answer, LinkKeys, Priority, Sort, State)
    VALUES (N'ifare-platform', N'i-Fare 平台介紹', N'i-fare平台,ifare平台,福利好幫手,i-fare是什麼,ifare是什麼,i-fare功能', N'「i-Fare」是本站的福利政策搜尋平台。您可以用受助者情況、年齡區間、戶籍地跟關鍵字找政策，想再細一點就按「篩選」。', N'ifare', 1.00, 90, N'啟用');

IF NOT EXISTS (SELECT 1 FROM dbo.ChatbotCard WHERE CardKey = N'foundation-establishment')
    INSERT INTO dbo.ChatbotCard (CardKey, Title, Keywords, Answer, LinkKeys, Priority, Sort, State)
    VALUES (N'foundation-establishment', N'基金會的成立', N'基金會成立,長穩成立,何時成立,什麼時候成立,哪一年成立,成立日期,創辦人,誰創辦', N'長穩社福慈善基金會在 2017 年 7 月 19 日成立，由穩懋半導體董事長陳進財先生創辦，鄔筠軒女士擔任第一任董事長到現在。成立目的是整合社會福利資訊，並推動教育平權、永續環境跟社會關懷。', N'about', 1.00, 100, N'啟用');

IF NOT EXISTS (SELECT 1 FROM dbo.ChatbotCard WHERE CardKey = N'foundation-mission')
    INSERT INTO dbo.ChatbotCard (CardKey, Title, Keywords, Answer, LinkKeys, Priority, Sort, State)
    VALUES (N'foundation-mission', N'基金會的使命', N'基金會使命,長穩使命,使命是什麼', N'長穩的使命是推動「環境保育、人才培育、社會關懷」三大核心行動。以文化、教育跟科技公益為基礎，減少社會落差，為台灣下一代打造更有韌性的未來。', N'about', 1.00, 110, N'啟用');

IF NOT EXISTS (SELECT 1 FROM dbo.ChatbotCard WHERE CardKey = N'foundation-core')
    INSERT INTO dbo.ChatbotCard (CardKey, Title, Keywords, Answer, LinkKeys, Priority, Sort, State)
    VALUES (N'foundation-core', N'基金會三大核心', N'三大核心,核心介紹,核心行動,基金會核心,長穩核心', N'三大核心是「環境保育、人才培育、社會關懷」。環境保育聚焦油芒復耕跟永續教育，人才培育涵蓋兒少心理、土地教育、青年志工跟教師支持，社會關懷則靠 i-Fare 整合社福資源。', N'about', 1.00, 120, N'啟用');

IF NOT EXISTS (SELECT 1 FROM dbo.ChatbotCard WHERE CardKey = N'core-environment')
    INSERT INTO dbo.ChatbotCard (CardKey, Title, Keywords, Answer, LinkKeys, Priority, Sort, State)
    VALUES (N'core-environment', N'核心行動：環境保育', N'環境保育,油芒,永續糧食,生態教育,文化復振', N'「環境保育」面對極端氣候跟環境變遷，以油芒復耕為起點，推動永續糧食研究、生態教育跟在地文化復振，並用跨域合作提升土地與社會的韌性。', N'about', 1.00, 130, N'啟用');

IF NOT EXISTS (SELECT 1 FROM dbo.ChatbotCard WHERE CardKey = N'core-talent')
    INSERT INTO dbo.ChatbotCard (CardKey, Title, Keywords, Answer, LinkKeys, Priority, Sort, State)
    VALUES (N'core-talent', N'核心行動：人才培育', N'人才培育,芒望未來,兒少心理,土地教育,青年志工,教師支持,志工培訓', N'「人才培育」以教育為核心，涵蓋兒少心理健康、土地教育、青年志工跟教師支持。基金會推動「芒望未來」教育計畫、兒少心理教育、志工培訓跟跨校合作。', N'about', 1.00, 140, N'啟用');

IF NOT EXISTS (SELECT 1 FROM dbo.ChatbotCard WHERE CardKey = N'core-care')
    INSERT INTO dbo.ChatbotCard (CardKey, Title, Keywords, Answer, LinkKeys, Priority, Sort, State)
    VALUES (N'core-care', N'核心行動：社會關懷', N'社會關懷,社福資源,資訊落差,資源透明,社會安全網', N'「社會關懷」以 i-Fare 社福資源平台為核心，整合全台公部門跟民間的補助資訊，減少資訊落差，讓需要的人更快找到協助。', N'ifare', 1.00, 150, N'啟用');

IF NOT EXISTS (SELECT 1 FROM dbo.ChatbotCard WHERE CardKey = N'foundation-members')
    INSERT INTO dbo.ChatbotCard (CardKey, Title, Keywords, Answer, LinkKeys, Priority, Sort, State)
    VALUES (N'foundation-members', N'基金會成員', N'主要成員,有哪些成員,基金會成員,基金會團隊,董事長,副董事長,執行長,陳進財,鄔筠軒,顏杏蓉', N'創辦人是陳進財先生，現任穩懋半導體董事長暨總裁；鄔筠軒女士是全穩生技農業科技集團副董事長，並擔任基金會第一任董事長到現在；執行長是顏杏蓉女士。', N'about', 1.00, 160, N'啟用');

IF NOT EXISTS (SELECT 1 FROM dbo.ChatbotCard WHERE CardKey = N'members-purpose')
    INSERT INTO dbo.ChatbotCard (CardKey, Title, Keywords, Answer, LinkKeys, Priority, Sort, State)
    VALUES (N'members-purpose', N'成員與宗旨', N'成員與宗旨,團隊與宗旨', N'基金會由陳進財先生創辦，鄔筠軒女士擔任第一任董事長，執行長是顏杏蓉女士。長穩相信每一份投入都能為孩子、家庭跟土地帶來改變，也歡迎大家加入行動、擔任志工或成為合作夥伴。', N'about', 1.00, 170, N'啟用');

IF NOT EXISTS (SELECT 1 FROM dbo.ChatbotCard WHERE CardKey = N'foundation-purpose')
    INSERT INTO dbo.ChatbotCard (CardKey, Title, Keywords, Answer, LinkKeys, Priority, Sort, State)
    VALUES (N'foundation-purpose', N'基金會宗旨與參與方式', N'基金會宗旨,宗旨是什麼,如何參與,加入行動,成為志工,支持基金會,支持我們,成為合作夥伴,合作夥伴', N'長穩相信每一份投入都能為孩子、家庭跟土地帶來改變。您可以參與教育活動跟志工服務、成為合作夥伴一起推動教育支持與社福資源整合，或用其他方式支持我們。', N'about', 1.00, 180, N'啟用');

IF NOT EXISTS (SELECT 1 FROM dbo.ChatbotCard WHERE CardKey = N'about')
    INSERT INTO dbo.ChatbotCard (CardKey, Title, Keywords, Answer, LinkKeys, Priority, Sort, State)
    VALUES (N'about', N'認識長穩', N'認識長穩,關於長穩,基金會介紹,團隊介紹,長穩在做什麼', N'長穩社福慈善基金會 2017 年 7 月 19 日成立，由陳進財先生創辦，鄔筠軒女士擔任第一任董事長到現在。以環境保育、人才培育、社會關懷為三大核心，整合福利資訊、推動教育支持跟永續行動。', N'about', 1.00, 190, N'啟用');

IF NOT EXISTS (SELECT 1 FROM dbo.ChatbotCard WHERE CardKey = N'news')
    INSERT INTO dbo.ChatbotCard (CardKey, Title, Keywords, Answer, LinkKeys, Priority, Sort, State)
    VALUES (N'news', N'最新消息', N'最新消息,近期消息,公告,活動消息,新聞', N'「最新消息」會放基金會公告、活動跟近期更新。進到列表後，點文章標題就能看完整內容。', N'news', 1.00, 200, N'啟用');

IF NOT EXISTS (SELECT 1 FROM dbo.ChatbotCard WHERE CardKey = N'articles')
    INSERT INTO dbo.ChatbotCard (CardKey, Title, Keywords, Answer, LinkKeys, Priority, Sort, State)
    VALUES (N'articles', N'福利專欄', N'福利專欄,專欄頁,懶人包,政策文章,文章列表', N'「福利專欄」整理了福利資訊、政策文章跟懶人包。進到列表後，選您想看的標題就能讀完整篇。', N'articles', 1.00, 210, N'啟用');

IF NOT EXISTS (SELECT 1 FROM dbo.ChatbotCard WHERE CardKey = N'partners')
    INSERT INTO dbo.ChatbotCard (CardKey, Title, Keywords, Answer, LinkKeys, Priority, Sort, State)
    VALUES (N'partners', N'公益夥伴', N'公益夥伴,夥伴頁,合作單位,服務分類,核心議題', N'「公益夥伴」可以依兒少、老人、身心障礙這些服務分類看合作單位，也能依環境保育、人才培育、社會關懷等核心議題切換。點分類頁籤就會換內容。', N'collaborator', 1.00, 220, N'啟用');

IF NOT EXISTS (SELECT 1 FROM dbo.ChatbotCard WHERE CardKey = N'contact')
    INSERT INTO dbo.ChatbotCard (CardKey, Title, Keywords, Answer, LinkKeys, Priority, Sort, State)
    VALUES (N'contact', N'聯絡資訊', N'聯絡資訊,基金會電話,聯絡電話,facebook,社群連結,客服資訊,怎麼聯絡', N'基金會的聯絡資訊跟社群連結都在網站最下方。那裡可以看到聯絡電話，也能點 Facebook 圖示到粉絲團。', N'', 1.00, 230, N'啟用');
GO

PRINT N'芒寶答案卡初始資料匯入完成，共 23 張卡片。';
GO

-- 驗證
SELECT ID, CardKey, Title, Sort, State, LEN(Answer) AS AnswerLength
FROM dbo.ChatbotCard
WHERE State <> N'刪除'
ORDER BY Sort;
GO
