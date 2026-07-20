---
name: new-post
description: Create a new blog post when the user wants to write about a topic, record a technical note, or share an experience. Trigger when user says things like "帮我写一篇关于 X 的文章", "新建一篇文章", "记录一下 X", "写篇博客：X", "write a post about X", or any similar intent to create a new blog post.
---

The user wants to create a new blog post. Follow these steps exactly.

## Step 1 — Understand the content

From the user's description, extract:
- **Topic**: what is this post actually about
- **Category**: pick the most fitting from the blog's existing taxonomy:
  - `[JS, Base]` — JavaScript fundamentals (closures, prototype, event loop, etc.)
  - `[JS, Engineering]` — tooling and build (webpack, vite, pnpm, monorepo, etc.)
  - `[JS]` — other JavaScript topics
  - `[Vue]` — Vue-related
  - `[React]` — React-related
  - `[CSS]` — CSS-related
  - `[MiniApp]` — mini programs (WeChat, uniapp, etc.)
  - `[Essays]` — reflections, non-technical writing
- **Tags**: 2–4 lowercase English keywords

## Step 2 — Generate the filename

Run `date +%Y-%m-%d` to get today's date, then construct:

```
YYYY-MM-DD-short-english-slug.md
```

- slug: 2–4 English words, hyphen-separated, all lowercase
- slug should summarize the post topic, not be generic
- Example: `2026-06-13-react-use-effect.md`, `2026-06-13-pnpm-workspace.md`

## Step 3 — Write the frontmatter

```yaml
---
title: "English title, 5–10 words, Title Case"
description: "One English sentence describing what the post covers and what the reader will learn."
date: YYYY-MM-DD 00:00:00 +0800
categories: [Category]
tags: [tag1, tag2, tag3]
---
```

**title rules**:
- English, Title Case
- Under 10 words
- Direct — avoid "How to", "A Guide to", "Introduction to" openers

**description rules**:
- One complete English sentence
- Says the core angle or problem solved, not just a restatement of the title

## Step 4 — Create the file

Create the file at `/Users/lmy/Documents/blog/_posts/<filename>`.

Write the frontmatter, then leave one blank line. Do NOT write body content unless the user's message already contains enough detail — in that case, invoke the `rewrite-post` skill for style guidance and write only the opening paragraph, not a full article.

## Step 5 — Report back

Tell the user:
- The file path created
- The generated title and description (so they can confirm or adjust)
- If the category was a judgment call, briefly say why
