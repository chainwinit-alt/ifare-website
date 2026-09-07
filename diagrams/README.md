# 舊架構圖（2026-04）— 僅供歷史參考

這三張圖繪於 2026-04，之後未隨程式更新。**已知與現況不符處**（2026-09-01 校對）：

- 兩支 API 標「Kestrel + IIS 反向代理」——實際為 ANCM **in-process** 託管，不開獨立 TCP 埠
- `CompBreadCrumb.vue` 標「麵包屑（空）」——實際有完整實作，about／articles／collaborator／news 都在用
- `IFare_BDAPIDb` 標 AbpUsers 管「帳號／密碼／權限」——實際後台帳號與角色在主資料庫 `IFare` 的 `SysUser`（`Permissions` 欄位存中文字面值）
- 後台標「Pinia 持久化 Token 儲存」——2026-08-27 起 token 改存 sessionStorage
- 部分連線標籤殘留未轉義的 `<b>`／`<br>` 字樣

系統現況請以 `docs/iFare_系統文件.docx`（來源 `docs/src/iFare_系統文件.md`）為準。
