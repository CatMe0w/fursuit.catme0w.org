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

### V2 Database Update Notes

Starting from the remake version (1.0.0), the project uses the V2 database. See the SQL scripts in the `migrations` directory for changes.

To upgrade from V1 to V2 database, obtain the V1 database from [ex_nihilo_vault](https://github.com/CatMe0w/ex_nihilo_vault), then run the scripts to upgrade to V2.

## Install dependencies

Node.js is required. pnpm is recommended.

`pnpm i`

## Usage

### Start development server

`pnpm dev`

Then, you can visit the server at http://localhost:4321/

### Build

`pnpm build`

## License

[MIT License](https://opensource.org/licenses/MIT)
