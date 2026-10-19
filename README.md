# Car Town Remake

A fan-made 3D browser remake of the classic **Car Town** social game, built with
[three.js](https://threejs.org). Run your own garage, service NPC customers for
coins and XP, buy and customize cars, decorate and expand your lot, drive around
town and drag race your friends.

Every car is modelled in code, at real-world proportions. That includes the three
cars from the reference photos: the **smart #2**, the **Hyundai IONIQ 3 N Line**
and the yellow **Mercedes-AMG GLC EV**.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173  (single player)
```

For live online races between friends, run the bundled server instead. It
serves the built game and relays races over WebSocket:

```bash
npm run serve        # builds, then serves on http://localhost:3000
PORT=8080 npm start  # serve an existing build on another port
```

Share the server URL with friends on your network. One player creates a room
and the other joins with the 4-letter code. To use a server on another machine,
enter its address in **Settings → Online server**, for example
`ws://192.168.1.20:3000/ws`.

## What's in the game

| Area | Features |
| --- | --- |
| **My Garage** | Isometric garage that copies the original layout: walls with posters, red service lifts, the corner billboard, the crossroads with traffic, and friends' cars parked outside with name badges. |
| **Customers** | NPC cars drive in, park on a lift, wash bay or paint booth, and ask for a service (oil, tires, brakes, tune-up, wash, wax, respray). Each service uses fuel. You earn coins and XP, plus tips from your Luxury Points. |
| **HUD** | Speedometer level gauge with an odometer for XP, coins and Car Town Cash, a fuel gauge that refills over time, Photo button, sound, fullscreen and zoom, daily goals, friends and settings. |
| **Buy Cars** | Studio turntable dealer with 16 cars, stats (power, weight, grip, top speed, 1/8-mile time), and a colour choice before buying. |
| **Paint & Tune** | Paint and finish (gloss, metallic, pearl, matte, chrome, candy), two-tone roof, 13 rim designs, rim and caliper colours, liveries, spoilers, window tint, stance, underglow neon. Performance upgrades: engine, turbo, gearbox, tires, weight and nitrous. |
| **Edit Garage** | Buy, place, move, rotate and sell 28 items (lifts, wash bay, paint booth, arcade, jukebox, diner booth, trophy case and more). Also floor and wall themes, and lot expansions from 14×14 up to 22×22. |
| **Drag races** | Christmas-tree start, rev to the launch zone, shift in the green zone, nitro. Race 10 street racers, 6 NPC friends, friends imported by code, a second player on the same keyboard, or a friend online. |
| **Town** | Drive your active car around town: car dealer, paint shop, drag strip, gas station (buy fuel), car wash, your garage and friends' houses. Includes traffic, pedestrians and a minimap. |
| **Friends** | Share your **friend code**, a snapshot of your name, avatar and best car. A friend pastes it in and can race your car. |
| **Other** | English and Portuguese (BR) like the original screenshots. All sound effects and music are synthesised. Progress saves automatically in the browser. |

## Controls

| Where | Keys |
| --- | --- |
| Garage | Drag to pan, wheel or +/− to zoom, click cars and customers. In the editor, **R** rotates and **Esc** cancels. |
| Drag race (solo) | **Space** or click: hold to rev before the green light, then tap to shift. **N** fires the nitro. |
| Drag race (2 players) | P1: **Z** rev/shift, **X** nitro. P2: **M** rev/shift, **N** nitro. |
| Town | **WASD** or arrows to drive, **Space** to brake, **E** to enter a place, **C** to change camera, **H** for the horn, **Esc** to return to the garage. |

## How the cars are modelled

The cars are generated in code; there are no mesh files (`src/cars/`):

- `bodyV2.js` lofts a single smooth shell from character curves given in
  metres: roofline, beltline, shoulder, sill, plan widths, and the nose and tail
  shape. It adds wheel wells, raised fenders and hood ridges.
- `featured.js` holds the three cars from the photos. Each has hand-tuned
  curves and drawn details:
  - smart #2: perforated "smile" grille, LED eye headlights, champagne roof
    and tridion pillar.
  - IONIQ 3 N Line: pixel light bar, gloss-black A-shaped bumper, black arch
    cladding, star rims.
  - AMG GLC EV: illuminated vertical-bar grille with chrome surround and star,
    slim headlights.
- `archetypes.js` and `generic.js` build the rest of the line-up from
  body-type templates (hatch, sedan, coupe, SUV, van, pickup, off-roader,
  supercar and Beetle).
- Windows, lights, grilles, plates and liveries are drawn on canvases and
  projected onto the shell, with separate reflective glass and recolourable
  roof materials.
- Each car has two levels of detail. The detailed one is used in the
  showroom and races, the lighter one in the garage, traffic and town.

`dev/cars.html` is a small car lab for inspecting the models, for example
`http://localhost:5173/dev/cars.html?model=amgsuv&view=fq&rot=0&dist=6`.
It also takes an exact camera (`pos`, `look`, `fov`) and `env=studio` lighting.
[`docs/cars-vs-photos.jpg`](docs/cars-vs-photos.jpg) shows each featured car
next to its reference photo, rendered from a camera fitted to that photo.

## Project layout

```
src/
  app.js            mode switching and wiring
  core/             renderer loop, audio synth, i18n, utilities
  cars/             car generator, models, wheels, painter
  game/             state & economy, catalog, customers, drag physics, friends, netcode
  scenes/           garage, showroom, drag strip, town
  world/            props, characters, textures, traffic, garage surroundings
  ui/               HUD, dealer, paint shop, editor, race UI, panels, styles
server/server.js    static server + WebSocket race rooms
```

## Disclaimer

This is a non-commercial fan project and is not affiliated with Cie Games, Glu
or the original Car Town. Car makes and model names (smart, Hyundai, IONIQ,
Mercedes-AMG and others) are trademarks of their respective owners and are used
only to identify the cars recreated here. All models, textures and sounds in
this repository are generated by code.
