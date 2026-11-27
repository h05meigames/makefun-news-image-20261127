# The World — 27 November 2026

[![news-image-20261127](https://make.fun/badge/news-image-20261127.svg)](https://make.fun/bounty/news-image-20261127)
[![rank](https://make.fun/badge/news-image-20261127/h05meigames/makefun-news-image-20261127/rank.svg)](https://make.fun/bounty/news-image-20261127)
[![reward](https://make.fun/badge/news-image-20261127/h05meigames/makefun-news-image-20261127/reward.svg)](https://make.fun/bounty/news-image-20261127)

An entry for the [news-image-20261127](https://make.fun/bounty/news-image-20261127)
bounty: sum up Friday 27 November 2026's world news in a single image.

## The image

`main.ts` draws a one-page newspaper front page, **THE WORLD**, and writes
it to `<output-dir>/entry.png` (1024x1024, under 1 MiB). The front page
carries the day's stories:

- **Lead** — drones kill two Italian technicians at a Kuwaiti air-defence
  site; Kuwait and Italy blame Iran, Tehran denies any role — with a
  schematic map of the Gulf.
- **Storm** — a coastal storm blacks out about 900,000 on the US East Coast
  and postpones the 100th Macy's Thanksgiving Day Parade for the first time.
- **Gaza** — Hamas weighs its reply after strikes kill 10, including senior
  official Khaled Abu Nada and his wife.
- **Bangkok** — a blast at the Bangchak oil refinery injures at least nine.
- **Britain** — net migration falls to its lowest since 1997.
- Plus a "By the numbers" band and an "Also today" strip (World Chess
  Championship Game 3 drawn, Kim Jong Un on nuclear weapons, US GDP revised
  up to 4.3%, a diesel tanker capsized off Ibiza).

## How it works

The program uses only the Node standard library. It paints the page pixel
by pixel into a buffer, sets the type with a small single-stroke alphabet
defined in the source, and encodes the PNG by hand with `node:zlib`. There
is no network access, no randomness and no third-party module, so running it
twice writes byte-identical output.

Run it with:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

When `MAKEFUN_OUTPUT_DIR` is not set, the image goes to `/output`.

## Referral

https://make.fun/r/0ene8b3q
