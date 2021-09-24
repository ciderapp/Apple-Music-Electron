try {
    /*
    the queue does not respect the sorting
        can be done by managing 'MusicKit.getInstance().queue.items'

    songs that get loaded by the infinite scroll aren't sorted yet
        add some kind of listener on content changes and sort them after they're loaded?
    */

    /* sorting https://music.apple.com/library/songs does not work since stuff gets loaded (and requested) on scroll */
    let url = window.location.href;

    /* check for https://music.apple.com/library/playlist/ (and the beta variant + language code) */
    let matcher = url.match(/(https:\/\/)(beta\.)?(music\.apple.com\/library\/playlist\/)(p\..{15})(\?l.{3})?/);

    let contentNode;

    let songs = new Map();

    /* check if playlist id is set */
    if (matcher && matcher.length === 6 && matcher[4]) {
        let playlist = matcher[4].toLowerCase();

        contentNode = document.getElementsByClassName('songs-list')[0];

        if (contentNode) {
            /* click does not register if we add the event listener to the child divs themselves */
            contentNode.addEventListener('click', event => {
                /* last check of playlist id */
                if (!playlist) {
                    return;
                }

                storeSongs(playlist);

                if (checkClickArea('songs-list__header-col--song', event)) {
                    console.log('clicked song column');
                } else if (checkClickArea('songs-list__header-col--artist', event)) {
                    sortByArtist();
                } else if (checkClickArea('songs-list__header-col--album', event)) {
                    sortByAlbum();
                } else if (checkClickArea('songs-list__header-col--time', event)) {
                    console.log('clicked time column');
                }
            });
        }
    }

    function storeSongs(playlist) {
        /* get the cached data */
        let storageData = MusicKit.getInstance().api.storage.data;

        for (let element in storageData) {
            if (storageData.hasOwnProperty(element)) {
                /* check for the stored playlist data */
                if (element.match('(.*?)(library\.playlists\.)(' + playlist + ')(\..*)')) {
                    let value = JSON.parse(storageData[element]);

                    console.log('object', value);

                    let objects = value.d;

                    for (let object of objects) {
                        if (object.id.startsWith('p')) {
                            /* playlist */
                            let songData = object.relationships.tracks.data;

                            for (let song of songData) {
                                songs.set(song.id, {data: song, node: null});
                            }
                        } else {
                            /* song */
                            songs.set(object.id, {data: object, node: null});
                        }
                    }

                    /*
                    can be relevant for sorting:
                        song.attributes:
                            artistname
                            albumname
                            discnumber
                            name
                            tracknumber
                     */
                }
            }
        }

        let songNodes = contentNode.getElementsByClassName('songs-list-row');

        let songNodeData = [];

        /* store the node data and some other stuff to compare with the already stored songs */
        for (let songNode of songNodes) {
            let data = {
                songName: '',
                artistName: '',
                albumName: '',
                time: '',
                node: songNode
            };

            data.songName = songNode.getElementsByClassName('songs-list-row__song-name')[0].innerText;
            data.artistName = songNode.getElementsByClassName('songs-list-row__link')[0].innerText;
            data.albumName = songNode.getElementsByClassName('songs-list__col--album')[0].getElementsByTagName('p')[0].innerText;
            data.time = songNode.getElementsByClassName('songs-list-row__length')[0].innerText;

            songNodeData.push(data);
        }

        /* add the node elements to the song data */
        for (let song of songs.values()) {
            for (let data of songNodeData) {
                if (data.songName === song.data.attributes.name && data.albumName === song.data.attributes.albumName) {
                    song.node = data.node;
                }
            }
        }

        console.log('stored songs', songs);
    }

    function sortByArtist() {
        songs = new Map([...songs.entries()].sort((a, b) => {
            let valueA = a[1];
            let valueB = b[1];

            /* can add aditional sorting, like track number etc. */
            return valueA.data.attributes.artistName.localeCompare(valueB.data.attributes.artistName);
        }));

        manageNodes();
    }

    function sortByAlbum() {
        songs = new Map([...songs.entries()].sort((a, b) => {
            let valueA = a[1];
            let valueB = b[1];

            /* can add aditional sorting, like track number etc. */
            return valueA.data.attributes.albumName.localeCompare(valueB.data.attributes.albumName);
        }));

        manageNodes();
    }

    function manageNodes() {
        let headerNode = contentNode.getElementsByClassName('songs-list__header')[0];
        let weirdNode = contentNode.getElementsByClassName('songs-list__right-click-target')[0];
        let infiniteScrollNode = contentNode.getElementsByClassName('infinite-scroll')[0];

        while (contentNode.firstChild) {
            contentNode.firstChild.remove();
        }

        contentNode.appendChild(headerNode);
        contentNode.appendChild(weirdNode);

        for (let song of songs.values()) {
            /* can be 'null' if the cached elements have not been loaded in the document yet */
            if (song.node) {
                contentNode.appendChild(song.node);
            }
        }

        contentNode.appendChild(infiniteScrollNode);
    }

    function checkClickArea(className, event) {
        let column = contentNode.getElementsByClassName(className)[0];

        let artistRectangle = column.getBoundingClientRect();

        /* don't need to check height since its the same for the entire row */
        if (event.clientX >= artistRectangle.left && event.clientX <= artistRectangle.right) {
            console.log('column', column);

            return true;
        }

        return false;
    }
} catch (e) {
    console.error("[JS] Error while trying to apply addSort.js", e);
}