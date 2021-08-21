try {
    if (!multiplier && document.querySelector('.web-chrome-playback-lcd__volume')) {
        document.getElementsByClassName('web-chrome-playback-lcd__volume')[0].addEventListener('wheel', volumeChange);
        var multiplier = 0.05;

        function volumeChange(event) {
            if (checkScrollDirectionIsUp(event)) {
                if (MusicKit.getInstance().volume <= 1) {
                    if ((MusicKit.getInstance().volume + multiplier) > 1) {
                        MusicKit.getInstance().volume = 1
                    } else {
                        MusicKit.getInstance().volume = MusicKit.getInstance().volume + multiplier
                    }
                }
            } else {
                if (MusicKit.getInstance().volume >= 0) {
                    if ((MusicKit.getInstance().volume - multiplier) < 0) {
                        MusicKit.getInstance().volume = 0
                    } else {
                        MusicKit.getInstance().volume = MusicKit.getInstance().volume - multiplier
                    }
                }
            }
        }

        function checkScrollDirectionIsUp(event) {
            if (event.wheelDelta) {
                return event.wheelDelta > 0;
            }
            return event.deltaY < 0;
        }

    }
} catch (e) {
    console.error("[JS] Error while trying to apply scrollVol.js", e);
}