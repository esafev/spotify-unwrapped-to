import { parse as parseArgs } from 'flags';
import type { ExternalIdObject, TrackObjectFull, PagingObject, ArtistObjectFull } from 'spotifyTypes';

const textEncoder = new TextEncoder();

type TrackItem = {
  id: string,
  name: string,
  album: string,
  artists: string,
  extternal_ids: ExternalIdObject
}

async function fetchSpotify(token: string, offset: number = 0): PagingObject<TrackObjectFull> {
  try {
    return await fetch(`https://api.spotify.com/v1/me/tracks?offset=${offset}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }).then(r => {
      if (!r.ok) {
        throw(r);
      }

      return r.json();
    });
  } catch (e) {
    console.error(`\nSpotify error: ${e.status} — ${e.statusText}`);
    Deno.exit(1);
  }
};

function prepareTrackData({ items }: TrackObjectFull): TrackItem[] {
  return items.map(({ track: { name, id, album, artists, external_ids } }: TrackObjectFull) => ({
    id,
    name,
    album: album.name,
    artists: artists.map(({ name }: ArtistObjectFull) => name).join(', '),
    external_ids
  }));
}

function updateProgressBar(total: number, current: number) {
  const text = textEncoder.encode(`\rCurrent progress: [${current}/${total}] | ${Math.round((current / total) * 100)}%`);
  Deno.stdout.write(text);
}

async function recursiveFetchSpotify(token: string, offset: number = 0): Promise<TrackItem[]> {
  const data = await fetchSpotify(token, offset);

  if (data?.next) {
    updateProgressBar(data.total, offset);
    return prepareTrackData(data).concat(await recursiveFetchSpotify(token, offset + 20));
  } else {
    return prepareTrackData(data);
  }
}

async function createImportFile(fileName: string) {
  try {
    await Deno.stat(fileName);
    const promptAnswer = prompt(`File with ${fileName} name is exists. Do you want to replace content for this file?`, 'yes/no');

    if (promptAnswer && !['yes', 'y'].includes(promptAnswer)) {
      Deno.exit(1);
    }

    await Deno.create(fileName);
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      Deno.create(fileName);
    }
  }
}

async function writeDataToFile(fileName: string, data: TrackItem[]) {
  try {
    await Deno.writeTextFile(fileName, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
    Deno.exit(1);
  }
}

async function run() {
  const { OAuth, fileName, fileExt } = parseArgs(Deno.args, {
    string: ['fileName', 'fileExt', 'OAuth'],
    default: { fileName: 'export', fileExt: 'json' },
  });
  
  if (!OAuth) {
    console.error('Spotify API key not provided');
    Deno.exit(1);
  }

  if (!['json', 'xml'].includes(fileExt)) {
    console.error(`.${fileExt} ext. not supported`)
    Deno.exit(1);
  }

  const fullFileName = `${fileName}.${fileExt}`;
  await createImportFile(fullFileName);

  const tracks = await recursiveFetchSpotify(OAuth);
  await writeDataToFile(fullFileName, tracks);

  console.log(`\nFinish! Created file: ${fullFileName}`);
}

run();