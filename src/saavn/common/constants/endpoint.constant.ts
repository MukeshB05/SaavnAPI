export const Endpoints = {
  home: {
    launchData: 'webapi.getLaunchData',
    topSearches: 'content.getTopSearches'
  },
  search: {
    topSearch: 'content.getTopSearches',
    all: 'autocomplete.get',
    songs: 'search.getResults',
    albums: 'search.getAlbumResults',
    artists: 'search.getArtistResults',
    playlists: 'search.getPlaylistResults',
    more: 'search.getMoreResults'
  },
  radio: {
    featured: 'webradio.createFeaturedStation',
    artist: 'webradio.createArtistStation',
    entity: 'webradio.createEntityStation',
    songs: 'webradio.getSong'
  },
  recommendations: {
    songs: 'reco.getreco',
    albums: 'reco.getAlbumReco',
    artistOtherTopSongs: 'search.artistOtherTopSongs'
  },
  show: {
    show_details: 'webapi.get',
    episodes: 'show.getAllEpisodes',
    episode_details: 'webapi.get'
  },
  songs: {
    id: 'song.getDetails',
    link: 'webapi.get',
    suggestions: 'webradio.getSong',
    lyrics: 'lyrics.getLyrics',
    station: 'webradio.createEntityStation'
  },
  albums: {
    id: 'content.getAlbumDetails',
    link: 'webapi.get',
    recommend: 'reco.getAlbumReco',
    sameYear: 'search.topAlbumsoftheYear'
  },
  artists: {
    id: 'artist.getArtistPageDetails',
    link: 'webapi.get',
    songs: 'artist.getArtistMoreSong',
    albums: 'artist.getArtistMoreAlbum',
    topSongs: 'search.artistOtherTopSongs'
  },
  playlists: {
    id: 'playlist.getDetails',
    link: 'webapi.get',
    recommend: 'reco.getPlaylistReco'
  },
  discover: {
    newReleases: 'content.getAlbums',
    topCharts: 'content.getCharts',
    topPlaylists: 'content.getFeaturedPlaylists',
    topArtists: 'social.getTopArtists'
  },
  modules: 'content.getBrowseModules',
  trending: 'content.getTrending'
}
