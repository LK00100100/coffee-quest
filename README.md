# Coffee Quest

[Play here](https://sbs-game-coffee-quest.s3.amazonaws.com/index.html)

You are a coder in a Big City office.
You must code and you need coffee. The coffee machine is broken so you must illegally wander the deep inner bowels of the office and find enough machine parts to repair the machine. You must dodge various dangers to achieve your mission.

A simple action game.



## controls
- wsad - move (can't stop)
- space - eat pizza
- z,x - camera zoom (for debugging)

## game
- security guard - stops you
- rats - friendly to you; scares security.
- fire - bad for everyone
- $15 Big City Personal Pizza - temporary invincibility

Inspired by "Tomb of the Mask"

## Writing Code

`npm install` once.

Then use `npm start` (will reload on changes)

The `npm deploy` doesn't work when I'm using Windows 🤔

Deploy using `./scripts/deploy-to-s3.sh`.

## etc

`npm run build` - make prod build (minificiation, no source maps, etc).

`npm run dev` - build project, open server, don't watch for changes.

[phaser starter template](https://github.com/photonstorm/phaser3-typescript-project-template)

Tile bleed problem? [link](https://stackoverflow.com/questions/62936847/how-do-i-stop-my-tiles-from-bleeding-when-using-a-tilemap-in-phaser-3)
