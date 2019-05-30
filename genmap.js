// osmde tile URL: http://tile.openstreetmap.de/14/8574/5625.png

// https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#ECMAScript_.28JavaScript.2FActionScript.2C_etc..29
function long2tile(lon,zoom) { return (Math.floor((lon+180)/360*Math.pow(2,zoom))); }
function lat2tile(lat,zoom)  { return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom))); }


function gent_tile_url(suffix,zoom,coordinate) {
  // hard coded: use first tile server URL
  var url=layers.getLayers().item(layerState).getSource().urls[0];
  
  lonlat = ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326')
  zoom=map.getView().getZoom();
  x = long2tile(lonlat[0],zoom);
  y = lat2tile(lonlat[1],zoom);
  url = url.replace("{x}",x);
  url = url.replace("{y}",y);
  url = url.replace("{z}",zoom);
  if (suffix != "") {
    url = url + '/' + suffix;
  }
  return url;
};

function add_to_renderq_cb(data) {
 if (!data) {
   alert("unable to re-render tile");
 } else {
   alert(data);
 }
}
     
function open_tile_cb(obj) {
  url = gent_tile_url("",map.getView().getZoom(),obj.coordinate);
  // console.log(url);
  window.open(url, '_blank');
};

function open_tile_info_cb(obj) {
  url = gent_tile_url("status",map.getView().getZoom(),obj.coordinate);
  window.open(url, '_blank');
};

function add_to_renderq(obj) {
  url = gent_tile_url("dirty",map.getView().getZoom(),obj.coordinate);
  jQuery.get(url, add_to_renderq_cb);
};

var contextmenu = new ContextMenu({
  width: 170,
  defaultItems: false, // defaultItems are (for now) Zoom In/Zoom Out
  items: [
    {
      text: 'open tile url',
      classname: 'some-style-class', // add some CSS rules
      callback: open_tile_cb
    },
    {
      text: 'open tile info',
      classname: 'some-style-class', // add some CSS rules
      callback: open_tile_info_cb
    },    
    {
      text: 'add to render queue',
      classname: 'some-style-class', // add some CSS rules
      callback: add_to_renderq // `center` is your callback function
    }
  ]
});

// map, layers and layerstate are global
// layerstate is the number of the current active layer
var map;
var layers;
var layerState;

(function() {

    // default zoom, center and rotation (Karlsruhe);
    var zoom = 12;
    var center = ol.proj.transform([8.41,49], 'EPSG:4326', 'EPSG:3857')
    var rotation = 0;

    layers = new ol.layer.Group({
      'title': 'Maps',
      layers: [
      new ol.layer.Tile({
        title: 'OSM Standard',
        type: 'base',
        visible: false,
        zIndex : 1,
        source: new ol.source.OSM()
      }),
      new ol.layer.Tile({
        title: 'OSM sorbisch',
        type: 'base',
        visible: false,
        zIndex : 1,
        source: new ol.source.XYZ({
          attributions: [new ol.Attribution({html: "© sobuskutkowacy pola OpenStreetMap" })],
          url: location.protocol +  '//' + location.host + '/osmhrb/{z}/{x}/{y}.png'
        })
      }),
      new ol.layer.Tile({
        title: 'OSMde',
        type: 'base',
        visible: true,
        zIndex : 1,
        source: new ol.source.XYZ({
          attributions: [new ol.Attribution({html: "© OpenStreetMap -Mitwirkende" })],
          url: location.protocol + '//' + location.host + '/{z}/{x}/{y}.png'
        })
      })
    ]
    });

    if (window.location.hash !== '') {
      // try to restore center and zoom-level from URL
      var hash = window.location.hash.replace('#map=', '');
      var parts = hash.split('/');
      if (parts.length > 2) {
        zoom = parseInt(parts[0], 10);
        center = ol.proj.transform([parseFloat(parts[2]),parseFloat(parts[1])], 'EPSG:4326', 'EPSG:3857');
      }
      // set layer if given in URL
      if (parts.length === 4) {
        var lno=0;
        layers.getLayers().forEach(function(l) {
          if (lno==parts[3]) {
            l.setVisible(true);
            layerState=lno;
          } else {
            l.setVisible(false);
          }
          lno++;
        })
      }
    }

    map = new ol.Map({
        target: 'map',
        layers: [ layers ],
        interactions: ol.interaction.defaults({
          dragPan: false,
          mouseWheelZoom: false
        }).extend([
           new ol.interaction.DragPan({kinetic: false}),
           new ol.interaction.MouseWheelZoom({duration: 0})
        ]),
        target: 'map',
        view: new ol.View({
          center: center,
          zoom: zoom,
          rotation: rotation,
          minZoom: 0,
          maxZoom: 19
        })
    });

    var layerSwitcher = new ol.control.LayerSwitcher({
        tipLabel: 'Légende' // Optional label for button
    });
    map.addControl(layerSwitcher);
    var shouldUpdate = true;
    var view = map.getView();
    
    var updatePermalink = function() {
      if (!shouldUpdate) {
        // do not update the URL when the view was changed in the 'popstate'
        // handler
        shouldUpdate = true;
        return;
      }

      var center = ol.proj.transform(view.getCenter(), 'EPSG:3857', 'EPSG:4326');
      var hash = '#map=' +
          view.getZoom() + '/' +
          Math.round(center[1] * 10000) / 10000 + '/' +
          Math.round(center[0] * 10000) / 10000;
      var larr=layers.getLayers();
      // start from 1, not interested in overlay
      for (var i = 1; i < larr.getLength(); i++) {
        if (larr.item(i).getVisible()) {
          layerState = i;
          break;
        }
      }
      hash += '/' + layerState;
      var state = {
        zoom: view.getZoom(),
        center: view.getCenter(),
        rotation: 0,
        layerState: layerState
      };
      window.history.pushState(state, 'map', hash);
    };

    map.on('moveend', updatePermalink);
    layers.on('change', updatePermalink);
    map.addControl(contextmenu);
})();

