# GHOSTFILL

Paper nest desk for [pump.fun](https://pump.fun): VOID / NEST / PRINT. No keys.

ALEXYZ / session desk. No keys in this repo. Nothing sends.

The firehose looks busy. A lot of that curve is one cluster. GHOSTFILL scores unique wallets against fill velocity and keeps three reads:

| read | meaning |
| --- | --- |
| **VOID** | fat fill, almost nobody there |
| **NEST** | fill is climbing because a cluster is climbing |
| **PRINT** | unique is real, nest is quiet, paper may sit |

Default print window is **36+ unique**, nest **under 0.28**, fill **12–58%**. Below that the tape is still a ghost.

## What it does not do

- It does not copy a wallet
- It does not mint a clone for you
- It does not hold a key
- It does not send a trade

You open the name on pump.fun. You decide.

## Run

```bash
npm test
npm start
```

`npm start` replays the paper tape in the terminal.

```bash
npm run desk
```

Open http://127.0.0.1:8788

## Layout

```
src/rules.js      unique / nest / fill window
src/score.js      nest score 0..1
src/classify.js   SCAN / NEST / VOID / PRINT
src/tape.js       40s paper session, send always false
src/cli.js        terminal replay
scripts/serve.mjs local desk
test/             node:test
```

## Live later

`.env.example` is a stub. If you ever point this at a real mint feed, keep the key off disk and off git. The desk should still be eyes only.
