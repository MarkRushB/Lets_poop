import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const eventPath = process.env.GITHUB_EVENT_PATH;

if (!eventPath) {
  throw new Error('GITHUB_EVENT_PATH is required');
}

const payload = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
const issue = payload.issue;

if (!issue) {
  throw new Error('No issue found in webhook payload');
}

const body = issue.body ?? '';

const getField = (name) => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`###\\s*${escaped}\\n([\\s\\S]*?)(?=\\n###\\s|$)`);
  const match = body.match(regex);
  return match?.[1]?.trim() ?? '';
};

const isoDate = getField('事件日期');
const title = getField('事件标题');
const description = getField('事件描述');
const dogNamesRaw = getField('相关小狗');
const categoryRaw = getField('事件类型');
// Support both new field name "图片（可选）" and legacy "图片路径（可选）"
const imageRaw = getField('图片（可选）') || getField('图片路径（可选）');

if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
  throw new Error(`Invalid date format: ${isoDate}. Expected YYYY-MM-DD.`);
}

if (!title) {
  throw new Error('事件标题不能为空');
}

if (!description) {
  throw new Error('事件描述不能为空');
}

const dogNames = dogNamesRaw
  .split(/[\n,，]/)
  .map((item) => item.trim())
  .filter(Boolean);

if (dogNames.length === 0) {
  throw new Error('请至少填写一个相关小狗名字');
}

const validCategories = ['milestone', 'funny', 'meeting', 'legend'];
// The dropdown value looks like "milestone（里程碑）" – extract the leading word before "（"
const category = categoryRaw.split('（')[0].trim();
if (!category) {
  throw new Error('事件类型不能为空');
}
if (!validCategories.includes(category)) {
  throw new Error(`无效的事件类型：${category}。支持的类型：${validCategories.join(', ')}`);
}

const [year, month, day] = isoDate.split('-');
const monthNames = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
const displayDate = `${monthNames[Number(month) - 1]} ${day}`;

const chroniclePath = path.join(root, 'src/data/chronicle.json');
const chronicle = JSON.parse(fs.readFileSync(chroniclePath, 'utf8'));
const events = chronicle.events ?? [];
const maxId = events.reduce((max, event) => {
  const value = Number.parseInt(event.id, 10);
  return Number.isNaN(value) ? max : Math.max(max, value);
}, 0);

const newEvent = {
  id: String(maxId + 1),
  year,
  date: displayDate,
  title,
  description,
  category,
  dogNames
};

/**
 * Extract the first HTTP(S) image URL from raw field content.
 * Handles markdown image syntax ![alt](url) as well as bare URLs.
 */
function extractImageUrl(raw) {
  // Markdown image syntax takes priority: ![alt](url)
  const mdMatch = raw.match(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/);
  if (mdMatch) return mdMatch[1].trim();

  // Bare URL – strip common trailing punctuation that may have been included
  const urlMatch = raw.match(/https?:\/\/\S+/);
  if (urlMatch) return urlMatch[0].replace(/[),.'";]+$/, '');

  return null;
}

/**
 * Map a MIME content-type to a file extension.
 */
function getExtensionFromContentType(contentType) {
  const ctMap = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/avif': '.avif',
  };
  return ctMap[contentType] ?? '.jpg';
}

let resolvedImagePath = null;

// Ignore empty values and the GitHub "no response" placeholder
if (imageRaw && imageRaw !== '_No response_') {
  const imageUrl = extractImageUrl(imageRaw);

  if (imageUrl) {
    // Download the image and commit it under public/logs/YYYYMMDD/
    const dateFolder = `${year}${month}${day}`;
    const destDir = path.join(root, 'public/logs', dateFolder);

    // Determine file extension from URL path or Content-Type header
    let parsedUrl;
    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      throw new Error(`Invalid image URL: ${imageUrl}`);
    }
    let ext = path.extname(parsedUrl.pathname);
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    if (!ext) {
      const contentType = (response.headers.get('content-type') ?? '').split(';')[0].trim();
      ext = getExtensionFromContentType(contentType);
    }

    const fileName = `issue-${issue.number}${ext}`;
    const destPath = path.join(destDir, fileName);

    fs.mkdirSync(destDir, { recursive: true });
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(destPath, buffer);

    resolvedImagePath = `logs/${dateFolder}/${fileName}`;
    console.log(`Downloaded image to ${destPath}`);
  } else {
    // Treat as a pre-existing repo-relative path (e.g. logs/20260330/new.jpg)
    resolvedImagePath = imageRaw.replace(/^\//, '');
  }
}

if (resolvedImagePath) {
  newEvent.image = resolvedImagePath;
}

chronicle.events = [...events, newEvent];
fs.writeFileSync(chroniclePath, `${JSON.stringify(chronicle, null, 2)}\n`, 'utf8');

const summaryPath = path.join(root, 'issue-summary.md');
const summary = [
  `来自 #${issue.number} 的自动投稿：`,
  '',
  `- 自动分配 ID：${newEvent.id}`,
  `- 日期：${isoDate}`,
  `- 标题：${title}`,
  `- 类型：${category}`,
  `- 小狗：${dogNames.join('、')}`,
  resolvedImagePath ? `- 图片：${resolvedImagePath}` : '- 图片：无'
].join('\n');

fs.writeFileSync(summaryPath, `${summary}\n`, 'utf8');

console.log(`Added event ${newEvent.id}: ${newEvent.title}`);
