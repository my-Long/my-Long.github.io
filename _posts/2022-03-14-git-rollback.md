---
title: "Git Rollback Strategies"
description: "The difference between git revert and git reset, and when to use each for rolling back commits."
date: 2022-03-14 16:33:00 +0800
categories: [JS, Engineering]
tags: [git]
---

代码提交错了，要怎么回退？这里有两个完全不同的工具。

**`git revert`** 是往前走——它不删除那次提交，而是创建一个新的 commit，把指定的那次 commit 的改动反向应用。历史记录里两次 commit 都在，只是新的一次把旧的抵消掉了。适合已经 push 出去的提交，不影响别人的历史。

**`git reset`** 是往回走——直接把 HEAD 移回指定的 commit，有两种力度：

```bash
git reset --soft HEAD^   # 回到上一个 commit，改动保留在暂存区
git reset --hard HEAD^   # 回到上一个 commit，改动直接丢弃
```

`--soft` 温柔，改动还在，只是变成未提交的状态；`--hard` 粗暴，直接清掉。想回到指定 commit 可以用 commit id：

```bash
git reset --hard <commit_id>
```

reset 完如果要同步到远程，要加 `--force`：

```bash
git push origin HEAD --force
```

---

reset 过头了怎么办？`git reflog` 记录了你每一次操作：

```bash
$ git reflog

c7edbfe HEAD@{0}: reset: moving to c7edbfefab1bdbef6cb60d2a7bb97aa80f022687
470e9c2 HEAD@{1}: reset: moving to 470e9c2
b45959e HEAD@{2}: revert: Revert "add img"
```

找到你想恢复的那个 id，再 reset 回去就行：

```bash
git reset --hard b45959e
```

reflog 是本地操作记录，不会推送到远程，丢了就真丢了——所以 `--hard` 之前要想清楚。
