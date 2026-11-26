# fursuit.catme0w.org Remake

中文版请见[这里](https://github.com/CatMe0w/fursuit.catme0w.org/blob/master/README_zh.md)。

Webpages for Project Ex Nihilo.

Project Ex Nihilo is an internet archiving project, containing a complete archive of Baidu Tieba "fursuit" (forum) data as of February 2022.

**Visit now**: https://fursuit.catme0w.org/

## Remake Update Notes

The project has been completely rewritten, with the version number jumping to 1.0.0. The old Rust backend has been removed, and all original logic has been migrated to the frontend, i.e., this repository.

The URL structure has been changed, but remains compatible with old links.

### Major Updates

- Significantly improved design and interaction logic
- Significantly improved mobile browsing experience
- Significantly improved search functionality
- Significantly improved labeling of vandalism events, now able to clearly distinguish vandals (spam bots and various fake accounts that usurped moderation positions during the incident)
- Fixed numerous images displaying "parameter error"
- Migrated image, video, and audio resources to my self-managed S3 storage, no longer dependent on Baidu's network services
- Completed video and audio playback functionality
- Completed red text and bold rendering
- Completed signature display

## Install dependencies

Node.js is required. pnpm is recommended.

`pnpm i`

## Usage

### Start development server

`pnpm dev`

Then, you can visit the server at http://localhost:4321/

### Build

`pnpm build`

## Database

No setup is needed by default. If `data/vault.db` does not exist, `pnpm dev` and `pnpm build` download it from our S3 storage. The database version is set in `src/lib/dbConfig.ts`. After a version change, delete `data/vault.db` to download the new version.

To build the database yourself, get the V1 database from [ex_nihilo_vault](https://github.com/CatMe0w/ex_nihilo_vault). Then run the scripts in `migrations` in order (`v1_to_v2.sql`, `v2_to_v3.sql`, ...), and save the result as `data/vault.db`.

## License

[MIT License](https://opensource.org/licenses/MIT)
