const videos = [
    document.getElementById("cam1"),
    document.getElementById("cam2"),
    document.getElementById("cam3"),
    document.getElementById("cam4"),
];

const readers = [];

videos.forEach((video) => {

    const reader = new MediaMTXWebRTCReader({

        url: "http://localhost:8889/live/whep",

        onError: (err) => {
            console.error(err);
        },

        onTrack: (evt) => {
            video.srcObject = evt.streams[0];
        },

        onDataChannel: (evt) => {
            evt.channel.binaryType = "arraybuffer";
        }

    });

    readers.push(reader);

});

window.addEventListener("beforeunload", () => {

    readers.forEach(reader => reader.close());

});
