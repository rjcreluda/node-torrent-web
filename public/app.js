
Vue.config.productionTip = false;

var socket = io('http://torrent-web.ixra1300.odns.fr');

socket.on('torrent', function(torrent) {
  app.m.url = '';
  app.m.torrent = torrent;
  app.m.submitting = false;
});

socket.on('bad-torrent', function() {
  alert('Invalid Torrent');
  app.m.submitting = false;
});

var app = new Vue({
  el: '#app',
  data: {
    m: {
      //url: 'magnet:?xt=urn:btih:e7df485cf22a974e1ba8f9d6dac38270860b54ba&dn=Computer%20Programming%20JavaScript,%20Python,%20HTML,%20SQL,%20CSS%20The%20step%20by%20step%20guide%20for%20beginners%20to%20intermediate%20Including%20some%20black%20hat%20hacking%20Tips&tr=udp%3A%2F%2Ftracker.publicbt.com%2Fannounce&tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce',
      url: 'magnet:?xt=urn:btih:dc47d67d871a0461c96a12c1db72b4409560386e&dn=Bueno%20E.,%20Palcar%20V.%20-%20Real-World%20Flutter%20by%20Tutorials%20(1st%20Edition)%20-%202022.pdf&tr=udp%3A%2F%2Ftracker.publicbt.com%2Fannounce&tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce',
      torrent: null,
      submitting: null,
      bgColor: 'white',
    },
  },
  mounted() {
    console.log( this.currentPage );
    this.checkHash();
  },
  computed: {
    currentPage() {
      if (this.m.torrent) return 'torrents-page';
      if (this.m.submitting) return 'loading-page';
      return 'add-page';
    },
  },
  methods: {
    checkHash() {
      const hash = window.location.hash.substring(1);
      if (hash) {
        setTimeout(() => {
          if (this.m.torrent && this.m.torrent.url === hash) return;
          if (this.m.torrent) this.back();
          this.m.url = hash;
          this.add();
        }, 500);
      }
    },
    add() {
      this.m.submitting = true;
      window.location.hash = '#' + this.m.url;
      socket.emit('add-torrent', this.m.url);
    },
    back() {
      socket.emit('remove-torrent');
      window.location.hash = '';
      this.m.torrent = null;
      this.m.submitting = null;
    },
    getBgColorStyle() {
      let color;
      switch (this.currentPage()) {
        case 'add-page':
          color = '#212121';
          break;
        case 'loading-page':
          color = '#212121';
          break;
        case 'torrents-page':
          color = '#455A64';
          break;
      }
      return { 'background-color': color };
    },
    size(bytes, precision) {
      const kilobyte = 1024,
        megabyte = kilobyte * 1024,
        gigabyte = megabyte * 1024,
        terabyte = gigabyte * 1024;

      if (bytes >= 0 && bytes < kilobyte) {
        return bytes + ' B';
      } else if (bytes >= kilobyte && bytes < megabyte) {
        return (bytes / kilobyte).toFixed(precision) + ' KB';
      } else if (bytes >= megabyte && bytes < gigabyte) {
        return (bytes / megabyte).toFixed(precision) + ' MB';
      } else if (bytes >= gigabyte && bytes < terabyte) {
        return (bytes / gigabyte).toFixed(precision) + ' GB';
      } else if (bytes >= terabyte) {
        return (bytes / terabyte).toFixed(precision) + ' TB';
      } else {
        return bytes + ' B';
      }
    },
  },
});
