import { playlistDetails, singleTrack, trackTypes } from '../types';

import { convertToSubArray } from './utils';
import spotifyApi from './spotifyApi';

/**
 * Retrieves all tracks in a Spotify playlist using the provided link.
 * @async
 * @function getAllTracksInAPlaylist
 * @param {string} link - The link to the Spotify playlist.
 * @returns {Array} An array of track objects, each containing information about a track in the playlist.
 * @throws {Error} An error object with details of the error, if an error occurs while retrieving the playlist tracks.
 */
export async function getAllTracksInAPlaylist(link: string): Promise<any> {
	try {
		const data = await spotifyApi.getPlaylistTracks(link);
		return data.body.items;
	} catch (err) {
		return err;
	}
}

/**
  Creates a new playlist on Spotify with a specific name and description based on the provided artists.
**/
export async function createPlayList(
	artists: string,
	type: 'new' | 'old',
): Promise<playlistDetails | { isError: boolean; err: any }> {
	let description = '';
	if (type === 'new') {
		description = `Listen To Something New From ${artists}`;
	} else if (type === 'old') {
		description = `Listen to songs from your favourite artists ${artists}`;
	}
	try {
		const data = await spotifyApi.createPlaylist(
			'PlayList Generated By HearItFresh',
			{ description: description, public: true },
		);
		return {
			id: data.body.uri,
			link: data.body.external_urls.spotify,
			name: data.body.name,
		};
	} catch (err) {
		return { isError: true, err };
	}
}

/**

  Adds an array of track URIs to a Spotify playlist with the specified ID.
  @async
  @function addTracksToPlayList
  @param {string[]} tracks - An array of track URIs to add to the playlist.
  @param {string} playListID - The ID of the playlist to add the tracks to.
  @returns {Promise<Object>} A promise that resolves with the data returned by the Spotify API if successful
  @throws {Error} - If there is an error fetching data from the Spotify Web API.
**/
export async function addTracksToPlayList(
	tracks: string[],
	playListID: string,
) {
	try {
		const _data = await spotifyApi.addTracksToPlaylist(playListID, tracks);
		return _data;
	} catch (err) {
		return err;
	}
}

/**
  This asynchronous function takes an artist name as its input, searches for the artist using the Spotify Web API's searchArtists method,
  retrieves their top 10 albums using the getArtistAlbums method, removes any remixes or duplicate tracks, and returns up to five randomly
  selected album IDs. If the artist has fewer than five albums, it returns all of the available album IDs.
**/
export async function getArtistsAlbums(artist: string, artistsLength: number) {
	let maxAlbums: number;
	if (artistsLength === 20) {
		maxAlbums = 5;
	} else {
		maxAlbums = Math.floor(100 / (artistsLength * 2));
	}

	try {
		const _data = await spotifyApi.searchArtists(artist, {
			limit: 1,
			offset: 0,
		});
		const artistId = _data.body.artists?.items[0].id as string;
		const options = { limit: 10, album_type: 'album', include_groups: 'album' };
		const data = await spotifyApi.getArtistAlbums(artistId, options);

		let result = data.body.items.filter((album: { name: string }) => {
			const trackName = album.name.toLowerCase();

			// Check if the track is a remix or a mix or an edit or a radio mix
			const blacklistedWords = [
				'remix',
				'mix',
				'edit',
				'radio',
				'- live',
				' ver.',
				'live-',
				'version',
				'tour',
				'live',
				'event',
				'concert',
				'tour',
			];
			if (blacklistedWords.some((word) => trackName.includes(word))) {
				return false;
			}

			return true;
		});

		if (maxAlbums >= result.length) {
			return result.map((item: { id: any }) => item.id);
		} else {
			const sortedAlbum = result.sort(() => Math.random() - 0.5);
			const randomlySelectedAlbum = sortedAlbum
				.slice(0, maxAlbums)
				.map((item: { id: any }) => item.id);
			return randomlySelectedAlbum;
		}
	} catch (err) {
		return err;
	}
}

export async function getTracks(
	albums: string[],
): Promise<trackTypes | { isError: boolean; err: any }> {
	const tracks: trackTypes[] = [];
	const subArrays = convertToSubArray(albums);

	try {
		// Loop through each subarray of album IDs
		for (const subArray of subArrays) {
			let subTracks: singleTrack[] = [];
			// Call the Spotify Web API's getAlbums method with the subarray of IDs
			const data = await spotifyApi.getAlbums(subArray);

			data.body.albums.forEach((item) =>
				item.tracks.items.forEach((track) => {
					subTracks.push({
						name: track.name,
						albumName: item.name,
						uri: track.uri,
					});
				}),
			);
			subTracks = subTracks.filter((track, index, self) => {
				const trackName = track.name.toLowerCase();

				// Check if the track is a remix or a mix or an edit or a radio mix
				const blacklistedWords = [
					'remix',
					'mix',
					'edit',
					'radio',
					'- live',
					' ver.',
					'live-',
					'version',
					'tour',
					'live',
					'event',
					'concert',
					'tour',
				];
				if (blacklistedWords.some((word) => trackName.includes(word))) {
					return false;
				}

				// Check if the track is a repetition
				for (let i = 0; i < index; i++) {
					if (self[i].name === track.name) {
						return false;
					}
				}

				return true;
			});

			tracks.push(subTracks.flat());
		}

		return tracks.flat();
	} catch (err: any) {
		return { isError: true, err };
	}
}

export async function getUserTopArtists() {
	try {
		const data = await spotifyApi.getMyTopArtists({ limit: 10 });

		return data.body.items;
	} catch (err) {
		return err;
	}
}

export async function removeTracksFromPlaylists(
	playlistId: string,
	tracks: { uri: string }[],
): Promise<boolean> {
	try {
		await spotifyApi.removeTracksFromPlaylist(playlistId, tracks);
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
}

// /**
//   Searches for an artist on Spotify and returns an array of their top tracks in the US.
//   @async
//   @function getArtistTopTracks
//   @param {string} artist - The name of the artist to search for.
//   @returns {Promise<Array<string>>} An array of track URIs from the artist's top tracks in the US.
//   @throws {Error} If there was an error searching for the artist or retrieving their top tracks.
// */
// export async function getArtistTopTracks(artist) {
//   try {
//     const result = [];
//     const data = await spotifyApi.searchArtists(artist, { limit: 1, offset: 0 });
//     const _data = await spotifyApi.getArtistTopTracks(data.body.artists.items[0].id, 'US');
//     _data.body.tracks.forEach(song => result.push(song.uri))
//     return result
//   } catch (err) {

//     return err
//   }

// }

// export async function getOneAlbumTrack(album) {
//   try {
//     const data = await spotifyApi.getAlbumTracks(album, { limit: 6, offset: 0 })
//     const result = data.body.items.filter((track, index, self) => {
//       const trackName = track.name.toLowerCase()

//       // Check if the track is a remix or a mix or an edit or a radio mix
//       const blacklistedWords = ['remix', 'mix', 'edit', 'radio', '- live', ' ver.', 'live-'];
//       if (blacklistedWords.some(word => trackName.includes(word))) {
//         return false;
//       }

//       // Check if the track is a repetition
//       for (let i = 0; i < index; i++) {
//         if (self[i].name === track.name) {
//           return false;
//         }
//       }

//       return true;
//     })

//     if (result.length === 0) return ''

//     if (result.length > 1) {
//       const sortedTracks = result.sort(() => Math.random() - 0.5)
//       const randomlySelectedTrack = sortedTracks[0].uri
//       return randomlySelectedTrack
//     } else {
//       return result[0].uri
//     }
//   } catch (err) {
//     return err
//   }
// }
