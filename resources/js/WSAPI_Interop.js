var wsapi = {
    search(term, limit) {
        MusicKit.getInstance().api.search(term, {limit: limit, types: 'songs,artists,albums'}).then((results)=>{
            ipcRenderer.send('wsapi-returnSearch', JSON.stringify(results))
        })
    },
    getQueue() {
        ipcRenderer.send('wsapi-returnQueue', JSON.stringify(MusicKit.getInstance().queue._queueItems))
    },
    playTrackById(id) {
        MusicKit.getInstance().setQueue({ song: id }).then(function (queue) {
            MusicKit.getInstance().play()
        })
    },
    quickPlay(term) {
        // Quick play by song name
        MusicKit.getInstance().api.search(term, { limit: 2, types: 'songs' }).then(function (data) {
			MusicKit.getInstance().setQueue({ song: data["songs"][0]["id"] }).then(function (queue) {
				MusicKit.getInstance().play()
			})
		})
    },
    toggleShuffle() {
        MusicKit.getInstance().shuffleMode = MusicKit.getInstance().shuffleMode === 0 ? 1 : 0
    },
    toggleRepeat() {
        MusicKit.getInstance().repeatMode = MusicKit.getInstance().repeatMode === 0 ? 1 : 0
    }
}