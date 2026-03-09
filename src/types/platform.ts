export type PlatformInit = {
    name: string;
    bizhawkId: string;
    igdbId?: number;
    launchboxId?: string;
};

export class Platform {
    public readonly name: string;
    public readonly igdbId?: number;
    public readonly launchboxId?: string;
    public readonly bizhawkId: string;

    private static readonly registry: Platform[] = [];
    private static readonly byName: Map<string, Platform> = new Map();

    private constructor(init: PlatformInit) {
        this.name = init.name;
        this.igdbId = init.igdbId;
        this.launchboxId = init.launchboxId;
        this.bizhawkId = init.bizhawkId;
    }

    private static normalizeKey(v: string): string {
        return v.trim().toLowerCase();
    }

    private static define(init: PlatformInit): Platform {
        const p = new Platform(init);
        Platform.registry.push(p);
        Platform.byName.set(Platform.normalizeKey(p.name), p);
        return p;
    }

    public static values(): readonly Platform[] {
        return Platform.registry;
    }

    public static fromName(name: string): Platform {
        const p = Platform.tryFromName(name);
        if (!p) throw new Error(`Unknown platform name: ${name}`);
        return p;
    }

    public static tryFromName(name: string | undefined): Platform | undefined {
        if (!name) return undefined;
        return Platform.byName.get(Platform.normalizeKey(name));
    }

    public toString(): string {
        return this.name;
    }

    public static readonly Playstation = Platform.define({
        name: "PlayStation",
        igdbId: 7,
        launchboxId: "Sony Playstation",
        bizhawkId: "PSX",
    });

    public static readonly Playstation2 = Platform.define({
        name: "PlayStation 2",
        igdbId: 8,
        launchboxId: "Sony Playstation 2",
        bizhawkId: "PS2",
    });

    public static readonly Saturn = Platform.define({
        name: "Sega Saturn",
        igdbId: 32,
        launchboxId: "Sega Saturn",
        bizhawkId: "SAT",
    });

    public static readonly PcFx = Platform.define({
        name: "PC-FX",
        igdbId: 274,
        launchboxId: "NEC PC-FX",
        bizhawkId: "PCFX",
    });

    public static readonly SegaCD = Platform.define({
        name: "Sega CD",
        igdbId: 78,
        launchboxId: "Sega CD",
        bizhawkId: "GEN",
    });

    public static readonly TurboGrafxCD = Platform.define({
        name: "TurboGrafx-CD",
        igdbId: 150,
        launchboxId: "NEC TurboGrafx-CD",
        bizhawkId: "PCECD",
    });

    public static readonly Atari2600 = Platform.define({
        name: "Atari 2600",
        igdbId: 59,
        launchboxId: "Atari 2600",
        bizhawkId: "A26",
    });

    public static readonly Atari7800 = Platform.define({
        name: "Atari 7800",
        igdbId: 60,
        launchboxId: "Atari 7800",
        bizhawkId: "A78",
    });

    public static readonly Amiga = Platform.define({
        name: "Amiga",
        igdbId: 16,
        launchboxId: "Commodore Amiga",
        bizhawkId: "Amiga",
    });

    public static readonly AmstradCPC = Platform.define({
        name: "Amstrad CPC",
        igdbId: 25,
        launchboxId: "Amstrad CPC",
        bizhawkId: "AmstradCPC",
    });

    public static readonly AppleII = Platform.define({
        name: "Apple II",
        igdbId: 75,
        launchboxId: "Apple II",
        bizhawkId: "AppleII",
    });

    public static readonly Arcade = Platform.define({
        name: "Arcade",
        igdbId: 52,
        launchboxId: "Arcade",
        bizhawkId: "Arcade",
    });

    public static readonly Commodore64 = Platform.define({
        name: "Commodore 64",
        igdbId: 15,
        launchboxId: "Commodore 64",
        bizhawkId: "C64",
    });

    public static readonly FairchildChannelF = Platform.define({
        name: "Fairchild Channel F",
        igdbId: 127,
        launchboxId: "Fairchild Channel F",
        bizhawkId: "ChannelF",
    });

    public static readonly ColecoVision = Platform.define({
        name: "ColecoVision",
        igdbId: 68,
        launchboxId: "ColecoVision",
        bizhawkId: "Coleco",
    });

//    public static readonly Doom = Platform.define({
//        name: "Doom",
//        bizhawkId: "Doom",
//    });

    public static readonly DOS = Platform.define({
        name: "DOS",
        igdbId: 13,
        launchboxId: "MS-DOS",
        bizhawkId: "DOS",
    });

    public static readonly Dreamcast = Platform.define({
        name: "Dreamcast",
        igdbId: 23,
        launchboxId: "Sega Dreamcast",
        bizhawkId: "Dreamcast",
    });

    public static readonly GameCube = Platform.define({
        name: "Nintendo GameCube",
        igdbId: 21,
        launchboxId: "Nintendo GameCube",
        bizhawkId: "GameCube",
    });

    public static readonly GameBoy = Platform.define({
        name: "Game Boy",
        igdbId: 33,
        launchboxId: "Nintendo Game Boy",
        bizhawkId: "GB",
    });

    public static readonly GameBoyAdvance = Platform.define({
        name: "Game Boy Advance",
        igdbId: 24,
        launchboxId: "Nintendo Game Boy Advance",
        bizhawkId: "GBA",
    });

    public static readonly GameBoyColor = Platform.define({
        name: "Game Boy Color",
        igdbId: 22,
        launchboxId: "Nintendo Game Boy Color",
        bizhawkId: "GBC",
    });

//    public static readonly GameBoyLink = Platform.define({
//        name: "Game Boy Link",
//        bizhawkId: "GBL",
//    });

    public static readonly Genesis = Platform.define({
        name: "Sega Genesis",
        igdbId: 29,
        launchboxId: "Sega Genesis",
        bizhawkId: "GEN",
    });

    public static readonly GameGear = Platform.define({
        name: "Sega Game Gear",
        igdbId: 35,
        launchboxId: "Sega Game Gear",
        bizhawkId: "GG",
    });

//    public static readonly GameGearLink = Platform.define({
//        name: "Game Gear Link",
//        bizhawkId: "GGL",
//    });

    public static readonly Intellivision = Platform.define({
        name: "Intellivision",
        igdbId: 67,
        launchboxId: "Mattel Intellivision",
        bizhawkId: "INTV",
    });

    public static readonly AtariJaguar = Platform.define({
        name: "Atari Jaguar",
        igdbId: 62,
        launchboxId: "Atari Jaguar",
        bizhawkId: "Jaguar",
    });

//    public static readonly Libretro = Platform.define({
//        name: "Libretro",
//        bizhawkId: "Libretro",
//    });

    public static readonly AtariLynx = Platform.define({
        name: "Atari Lynx",
        igdbId: 61,
        launchboxId: "Atari Lynx",
        bizhawkId: "Lynx",
    });

    public static readonly MSX = Platform.define({
        name: "MSX",
        igdbId: 27,
        launchboxId: "Microsoft MSX",
        bizhawkId: "MSX",
    });

    public static readonly Nintendo3DS = Platform.define({
        name: "Nintendo 3DS",
        igdbId: 37,
        launchboxId: "Nintendo 3DS",
        bizhawkId: "3DS",
    });

    public static readonly Nintendo64 = Platform.define({
        name: "Nintendo 64",
        igdbId: 4,
        launchboxId: "Nintendo 64",
        bizhawkId: "N64",
    });

    public static readonly NintendoDS = Platform.define({
        name: "Nintendo DS",
        igdbId: 20,
        launchboxId: "Nintendo DS",
        bizhawkId: "NDS",
    });

    public static readonly NeoGeoCD = Platform.define({
        name: "Neo Geo CD",
        igdbId: 136,
        launchboxId: "SNK Neo Geo CD",
        bizhawkId: "NeoGeoCD",
    });

    public static readonly NES = Platform.define({
        name: "Nintendo Entertainment System",
        igdbId: 18,
        launchboxId: "Nintendo Entertainment System",
        bizhawkId: "NES",
    });

    public static readonly NeoGeoPocket = Platform.define({
        name: "Neo Geo Pocket",
        igdbId: 119,
        launchboxId: "SNK Neo Geo Pocket",
        bizhawkId: "NGP",
    });

    public static readonly NeoGeoPocketColor = Platform.define({
        name: "Neo Geo Pocket Color",
        igdbId: 120,
        launchboxId: "SNK Neo Geo Pocket Color",
        bizhawkId: "NGPC",
    });

    public static readonly Odyssey2 = Platform.define({
        name: "Odyssey 2",
        igdbId: 133,
        launchboxId: "Magnavox Odyssey 2",
        bizhawkId: "O2",
    });

    public static readonly Panasonic3DO = Platform.define({
        name: "3DO",
        igdbId: 50,
        launchboxId: "3DO Interactive Multiplayer",
        bizhawkId: "3DO",
    });

    public static readonly TurboGrafx16 = Platform.define({
        name: "TurboGrafx-16",
        igdbId: 86,
        launchboxId: "NEC TurboGrafx-16",
        bizhawkId: "PCE",
    });

    public static readonly Playdia = Platform.define({
        name: "Playdia",
        igdbId: 308,
        launchboxId: "Playdia",
        bizhawkId: "Playdia",
    });

    public static readonly PhilipsCDi = Platform.define({
        name: "Philips CD-i",
        igdbId: 117,
        launchboxId: "Philips CD-i",
        bizhawkId: "PhillipsCDi",
    });

    public static readonly PSP = Platform.define({
        name: "PlayStation Portable",
        igdbId: 38,
        launchboxId: "Sony PSP",
        bizhawkId: "PSP",
    });

    public static readonly Satellaview = Platform.define({
        name: "Satellaview",
        igdbId: 306,
        launchboxId: "Nintendo Satellaview",
        bizhawkId: "BSX",
    });

    public static readonly Sega32X = Platform.define({
        name: "Sega 32X",
        igdbId: 30,
        launchboxId: "Sega 32X",
        bizhawkId: "32X",
    });

    public static readonly SG1000 = Platform.define({
        name: "SG-1000",
        igdbId: 84,
        launchboxId: "Sega SG-1000",
        bizhawkId: "SG",
    });

    public static readonly SuperGameBoy = Platform.define({
        name: "Super Game Boy",
        igdbId: 33,
        launchboxId: "Nintendo Game Boy",
        bizhawkId: "SGB",
    });

    public static readonly SuperGrafx = Platform.define({
        name: "SuperGrafx",
        igdbId: 128,
        launchboxId: "PC Engine SuperGrafx",
        bizhawkId: "SGX",
    });

    public static readonly SuperGrafxCD = Platform.define({
        name: "SuperGrafx CD",
        igdbId: 128,
        launchboxId: "PC Engine SuperGrafx",
        bizhawkId: "SGXCD",
    });

    public static readonly MasterSystem = Platform.define({
        name: "Sega Master System",
        igdbId: 64,
        launchboxId: "Sega Master System",
        bizhawkId: "SMS",
    });

    public static readonly SNES = Platform.define({
        name: "Super Nintendo Entertainment System",
        igdbId: 19,
        launchboxId: "Super Nintendo Entertainment System",
        bizhawkId: "SNES",
    });

//   public static readonly TI83 = Platform.define({
//       name: "TI-83",
//       bizhawkId: "TI83",
//   });
//
//   public static readonly TIC80 = Platform.define({
//       name: "TIC-80",
//       bizhawkId: "TIC80",
//   });
//
//   public static readonly Uzebox = Platform.define({
//       name: "Uzebox",
//       launchboxId: "Uzebox",
//       bizhawkId: "UZE",
//   });

    public static readonly VirtualBoy = Platform.define({
        name: "Virtual Boy",
        igdbId: 87,
        launchboxId: "Nintendo Virtual Boy",
        bizhawkId: "VB",
    });

    public static readonly Vectrex = Platform.define({
        name: "Vectrex",
        igdbId: 70,
        launchboxId: "GCE Vectrex",
        bizhawkId: "VEC",
    });

    public static readonly Wii = Platform.define({
        name: "Wii",
        igdbId: 5,
        launchboxId: "Nintendo Wii",
        bizhawkId: "Wii",
    });

    public static readonly WonderSwan = Platform.define({
        name: "WonderSwan",
        igdbId: 57,
        launchboxId: "WonderSwan",
        bizhawkId: "WSWAN",
    });

    public static readonly WonderSwanColor = Platform.define({
        name: "WonderSwan Color",
        igdbId: 123,
        launchboxId: "WonderSwan Color",
        bizhawkId: "WSWAN",
    });

    public static readonly ZXSpectrum = Platform.define({
        name: "ZX Spectrum",
        igdbId: 26,
        launchboxId: "Sinclair ZX Spectrum",
        bizhawkId: "ZXSpectrum",
    });
}