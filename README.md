# 小狗一起拉屎好吗？ / Let's Poop Together?

> **sl 狗狗群编年史** — 一个记录小狗群日常历史的横向滚动时间轴网站。
>
> **sl Dog Group Chronicle** — A horizontally-scrollable timeline website documenting the daily history of a dog group chat.

---

## 目录 / Table of Contents

- [功能介绍 / Features](#功能介绍--features)
- [技术栈 / Tech Stack](#技术栈--tech-stack)
- [本地开发 / Local Development](#本地开发--local-development)
- [无代码投稿 / No-Code Contribution](#无代码投稿--no-code-contribution)
- [自动部署 / Auto Deployment](#自动部署--auto-deployment)

---

## 功能介绍 / Features

### 中文

- **横向时间轴**：桌面端支持水平滚动浏览所有事件，移动端自动切换为竖向滚动。
- **事件详情弹窗**：点击"阅读更多"或描述超出预览长度时，右侧滑入详情面板，展示完整描述、相关小狗标签及图片。
- **按小狗筛选**：点击右上角 🔍 按钮，展开筛选面板，可按小狗名字过滤相关事件，并自动定位到第一条匹配结果。
- **事件分类**：每条事件归属以下四种类型之一：
  - `milestone` 里程碑
  - `funny` 搞笑
  - `meeting` 相聚
  - `legend` 传说
- **图片支持**：事件可携带图片，支持固定尺寸帧展示（`fixedImageSize` 属性）。
- **年份导航**：页面顶部（移动端）或侧边栏（桌面端）实时显示当前可见事件所属年份。

### English

- **Horizontal timeline**: Desktop shows all events in a horizontally-scrollable layout; mobile switches to a vertical scroll.
- **Event detail panel**: Clicking "Read more" slides in a right-side panel with the full description, dog name tags, and image.
- **Filter by dog**: Click the 🔍 button in the top-right to open a filter panel and narrow events by dog name, auto-scrolling to the first match.
- **Event categories**: Each event belongs to one of four categories:
  - `milestone` — major milestones
  - `funny` — humorous moments
  - `meeting` — group meetups
  - `legend` — legendary events
- **Image support**: Events can include images, with an optional fixed-size frame display (`fixedImageSize` property).
- **Year indicator**: The current event's year is shown in real time in the sidebar (desktop) or header (mobile).

---

## 技术栈 / Tech Stack

| 技术 / Technology | 版本 / Version |
|---|---|
| React | 19 |
| TypeScript | 5.8 |
| Vite | 6 |
| Tailwind CSS | 4 |
| Motion (Framer Motion) | 12 |
| Lucide React | 0.546 |

---

## 本地开发 / Local Development

### 中文

**前置要求**：Node.js 20+，npm

```bash
# 1. 克隆仓库
git clone https://github.com/MarkRushB/Lets_poop.git
cd Lets_poop

# 2. 安装依赖
npm install

# 3. 复制环境变量示例文件（如需使用 Gemini API Key）
cp .env.example .env
# 编辑 .env，填入 GEMINI_API_KEY

# 4. 启动开发服务器（端口 3000）
npm run dev

# 5. 构建生产版本
npm run build
```

### English

**Prerequisites**: Node.js 20+, npm

```bash
# 1. Clone the repository
git clone https://github.com/MarkRushB/Lets_poop.git
cd Lets_poop

# 2. Install dependencies
npm install

# 3. Copy the example env file (needed only if using the Gemini API Key)
cp .env.example .env
# Edit .env and fill in GEMINI_API_KEY

# 4. Start the dev server (port 3000)
npm run dev

# 5. Build for production
npm run build
```

---

## 无代码投稿 / No-Code Contribution

### 中文

无需修改代码，即可通过 GitHub Issue 表单新增编年史事件：

1. 打开仓库的 `Issues` 页面，点击 `New issue`。
2. 选择 **新增编年史事件** 模板。
3. 按表单填写事件日期（`YYYY-MM-DD`）、标题、描述、相关小狗（支持逗号/换行分隔）及事件类型。
4. 提交后自动触发 GitHub Action：
   - 将内容写入 `src/data/chronicle.json`，自动分配事件 ID
   - 自动创建或更新 PR（分支名：`automation/issue-<编号>`）
   - 在原 Issue 下留言 PR 链接，PR 将自动合并
5. PR 合并后，GitHub Pages 自动更新站点。

#### 图片上传

- **直接拖放或粘贴图片**到 Issue 表单中，GitHub 会自动上传并生成图片链接，Action 会将图片下载并存储到仓库 `public/logs/YYYYMMDD/` 目录下。
- 也可以填写已在仓库 `public` 目录中的图片相对路径，例如 `logs/20260330/new.jpg`。

### English

You can add new chronicle events without modifying any code, using a GitHub Issue form:

1. Go to the repository's `Issues` tab and click `New issue`.
2. Select the **新增编年史事件 (Add Chronicle Event)** template.
3. Fill in the event date (`YYYY-MM-DD`), title, description, related dog names (comma- or newline-separated), and event category.
4. Submitting the issue automatically triggers a GitHub Action that:
   - Writes the event to `src/data/chronicle.json` and auto-assigns an ID
   - Creates or updates a PR (branch: `automation/issue-<number>`)
   - Comments the PR URL on the original issue; the PR is then auto-merged
5. Once the PR is merged, GitHub Pages automatically updates the site.

#### Image Upload

- **Drag, drop, or paste an image** directly into the Issue form — GitHub uploads it automatically and generates a URL. The Action downloads it and stores it under `public/logs/YYYYMMDD/` in the repository.
- Alternatively, provide a repo-relative path to an image already in the `public` directory, e.g. `logs/20260330/new.jpg`.

---

## 自动部署 / Auto Deployment

### 中文

每次向 `main` 分支推送代码后，GitHub Actions 会自动构建并将 `dist/` 目录部署到 GitHub Pages。

**所需配置**：
- `GH_PAT`（仓库 Secret）：拥有 `Contents`、`Pull requests`、`Workflows` 写权限的 Fine-grained Personal Access Token，用于 Issue 投稿自动创建 PR 和自动合并。
- `GEMINI_API_KEY`（仓库 Secret，可选）：如启用 Gemini AI 功能需配置。

### English

Every push to the `main` branch triggers GitHub Actions to build the project and deploy the `dist/` directory to GitHub Pages.

**Required configuration**:
- `GH_PAT` (repository secret): A fine-grained Personal Access Token with write permissions for `Contents`, `Pull requests`, and `Workflows` — used by the Issue-to-PR automation.
- `GEMINI_API_KEY` (repository secret, optional): Required if Gemini AI features are enabled.
