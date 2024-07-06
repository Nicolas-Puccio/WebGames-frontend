# Testing
https://nicolas-puccio.github.io/WebGames-frontend/


# Thronecoop changelog

## Sunday, June 30

### Enemy AI
- Spawns with town center as a target.
- Will follow player if they enter trigger.
- Follows town center again if player is far away.

### Buildings
- Have a level and arrays for the town center level requirement and the upgrade cost.
- Trigger collision to detect player nearby.

### Game Manager
- Key to restart level.

### Player Script
- WASD movement.
- Space interacts with building.
- Holds coins and displays them on UI.

### Wave Manager
- Infinitely spawns enemies at a hardcoded position every X seconds.

## Sunday, July 7

### Map
- Bigger map plane.
- Add more buildings

### Buildings
- Keep a list of nearby enemies.
- Shoot at the first enemy to enter range.
- Buildings can be discovered after building another one.

### Arrows
- Arrow behavior (somewhat broken).

### Town Center
- Shoots Arrows.

### Towers
- Added towers that can shoot.