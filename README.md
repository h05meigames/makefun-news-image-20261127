# The World — 27 November 2026

[![make.fun · news-image-20261127](https://make.fun/badge/news-image-20261127.svg)](https://make.fun/bounty/news-image-20261127?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261127)
[![rank](https://make.fun/badge/news-image-20261127/h05meigames/makefun-news-image-20261127/rank.svg)](https://make.fun/bounty/news-image-20261127/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261127)
[![reward](https://make.fun/badge/news-image-20261127/h05meigames/makefun-news-image-20261127/reward.svg)](https://make.fun/bounty/news-image-20261127?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261127)

A one-image summary of Friday 27 November 2026's world news, drawn as a
newspaper front page (1024×1024 PNG) by `render_frontpage.py` (Pillow, no
network, no randomness). `main.ts` (Node 22) copies `entry.png` to
`/output/entry.png`.

## The day's news in this image

- **Lead — Drones kill two in Kuwait:** two Italian Rheinmetall Italia
  technicians die at a Kuwaiti air-defence site hit by drones. Kuwait and
  Italy blame Iran; Tehran denies any role. (Reuters, BBC, CNN, WSJ)
- **Thanksgiving storm:** a coastal storm leaves about 900,000 without
  power on the US East Coast; the 100th Macy's Thanksgiving Day Parade is
  postponed for the first time ever, moved to Saturday. (The Times, WSJ,
  People)
- **Gaza:** Hamas weighs a response after Israeli strikes kill 10 in Gaza,
  including senior Hamas official Khaled Abu Nada and his wife.
  (Reuters, France 24)
- **Bangkok:** an explosion at the Bangchak oil refinery injures at least
  nine; the company monitors air quality.
- **Britain:** net migration falls to its lowest since 1997, excluding the
  pandemic years. (NYT)
- **By numbers:** 2 killed in Kuwait · 900,000 without power in the US ·
  10 killed in Gaza · 9 hurt in Bangkok · 65 mph storm gusts.
- **Also today:** chess — Gukesh–Sindarov draw Game 3 of the World
  Championship · Kim Jong Un vows more nuclear weapons · US GDP revised
  up to 4.3% · diesel tanker capsizes off Ibiza, one dead.

## Entry

- Competition: [news-image-20261127](https://make.fun/bounty/news-image-20261127)
  — "Sum up 27 November's world news in one image"
- Referral: https://make.fun/r/0ene8b3q

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`out/entry.png` is byte-identical to `entry.png`. The render script is
deterministic: re-running it produces identical bytes.
