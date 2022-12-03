# Spotify-Unwrapped-To

Export your Spotify library to JSON. Written in Deno with NPM compatibility.

## Usage
1. Install [Deno](https://deno.land/manual/getting_started/installation)
2. [Create](https://developer.spotify.com/console/get-track/) a Spotify OAuth token with `user-library-read` permission
3. Execute in the directory's root:
`deno task run --OAuth='your-oauth-token' --fileName='my-library'`

## TODO
- [ ] `deno compile` [see [issue](http://https://github.com/denoland/deno/issues/16632)]
- [ ] Export to various formats [such as `xml`]
- [ ] Custom export schema support
- [ ] Create a good readme 🤪
