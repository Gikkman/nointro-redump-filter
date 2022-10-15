# System Test Information
System tests runs the entire process: scanning, sorting, moving/unzipping and writing the output files. These tests intends to make sure the entire process works as intended. They don't provide much information about what goes wrong however (that's what unit tests are for), but they can give some assurance that stuff works well together.

## Disc based tests
This folder contains files that are zipped, and once unzipped, contians files that _looks_ like disc based files. All games should be unzipped, and placed in a folder with their respective game names. XML files should be generated, pointing to the unzipped `.cue` files. There are 3 games:
* game-a
  * Is a multi-disc game. 
  * Disc 1 comes in two revisions (A and B). We expect the program to pick Rev A of this disc.
  * Is from USA, so it should give language 'En'
* game-b
  * Is a single-disc game.
  * There are a Japanese and an US version.  We expect the program to pick the US version
  * Since it should pick the US version, the language should be 'En'
* game-s
  * Is a single-disc game.
  * Has no region, so it should get region 'Unknown'
  * Since it has no region, the language should default to 'En'

 ## Cart based
This folder files that are zipped, but should not be unzipped. Instead, they should simply be copied over. All games should retain their relative paths from the base folder. There are 4 games:
* game-a
  * Has a Japanese and an European version. We expect the program to pick the EU version
  * The EU version lists language En, Es and De. We expect those to be picked up.
* game-b
  * We will send a file containing alias information, so game-b should have an alias "game-bb"
  * Has no region, so it should get region 'Unknown'
  * Since it has no region, the language should default to 'En'
* game-c
  * There are two Japanese versions, but one is tagged as translated. We expect the program to pick the translated version.
  * Language should be "En" due to the translation
* game-s
  * Is in a subfolder named "special", so the copy should also be in a subfolder named "special"