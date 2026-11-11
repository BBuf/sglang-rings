# Tree Rings of an Open-Source Project · 一个开源项目的年轮

**https://bbuf.github.io/sglang-rings/**

The git history of [sgl-project/sglang](https://github.com/sgl-project/sglang), drawn as a city you can walk around.
Every file is a building, and the more lines it has, the taller it stands. Each month the city grows one ring outward.
Type a GitHub username to find the buildings that person built.

把 [sgl-project/sglang](https://github.com/sgl-project/sglang) 的 git 历史画成一座可以随意看的城。
每个文件是一栋楼，行数越多楼越高；每过一个月，城市向外长一环。输入 GitHub 用户名，就能找到这个人盖的楼。

## Links

- `?u=<login>` opens the page on one contributor, for example `https://bbuf.github.io/sglang-rings/?u=merrymercy`
- `?lang=en` or `?lang=zh` sets the language; by default it follows the browser

## How it counts

- Data: the main branch as of 2026-11-11 (a93e89fd4), 22,195 first-parent commits, 2,334 contributors.
- Contributors are GitHub accounts, authors and co-authors. Bots and AI accounts are left out. A commit whose email is not linked to an account cannot be matched to a person.
- A building is *built* by you when the file first appeared in one of your commits, and *changed* by you when one of your commits touched it.
- The highlighted ring is the month of your first commit.

## About

This is the interactive version of the film [《一个开源项目的年轮》](https://www.bilibili.com/video/BV1VmWL6fEWE).
The repository holds only the built static page: plain HTML and JavaScript with three.js, no backend, no tracking.
Inspired by @EianLu's film about the growth rings of a city. The page and the film are code written by Claude Fable 5.2.
