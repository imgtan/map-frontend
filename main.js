window.onload = init; //call etmek yerine otomatik olarak çağırma
let xValue, yValue;
let places = [];
let point = [];
let pointFeature = [];
let vector_layer;
let allLocationsPanel;
let selectedRow;
let selectedItem;
let modifyLoc = [];
let modifyLocName;

function init() {
  const map = new ol.Map({
    view: new ol.View({
      //find other features from openlayers' doc file ol/View
      center: ol.proj.fromLonLat([35.5, 38.5]),
      zoom: 6, //max zoom min zoom can be coded.
      maxZoom: 26,
      minZoom: 2,
      //rotation: 0.5 //rotate the coordinate
    }), //layers part can be coded after map section
    // layers: [
    //     new ol.layer.Tile({
    //         source: new ol.source.OSM()
    //     })
    // ],
    target: "js-map",
  });

  const view = new ol.View({
    center: ol.proj.fromLonLat([35.5, 38.5]),
    zoom: 6, //max zoom min zoom can be coded.
    maxZoom: 26,
    minZoom: 2,
  });

  //layers part in map, can be coded like that
  const openStreetMapStandard = new ol.layer.Tile({
    source: new ol.source.OSM(),
    visible: true,
    title: "OSMStandard",
  });

  //to create layer
  map.addLayer(openStreetMapStandard);

  const source = new ol.source.Vector({ wrapX: false });

  const vector = new ol.layer.Vector({
    source: source,
  });

  map.addLayer(vector);

  let draw; // global so we can remove it later
  draw = new ol.interaction.Draw({
    source: source,
    type: "Point",
    //fill: new ol.style.Fill({color: "#00205c"})
  });

  draw.setActive(false);

  map.addInteraction(draw);

  toastr.options = {
    closeButton: true,
    debug: false,
    newestOnTop: true,
    progressBar: false,
    positionClass: "toast-top-right",
    preventDuplicates: false,
    showDuration: "300",
    hideDuration: "1000",
    timeOut: "5000",
    extendedTimeOut: "1000",
    showEasing: "swing",
    hideEasing: "linear",
    showMethod: "fadeIn",
    hideMethod: "fadeOut",
  };

  var vector_layer = new ol.layer.Vector({
    source: new ol.source.Vector({
      features: pointFeature,
    }),
  });
  map.addLayer(vector_layer);

  //AddLocation button
  document.getElementById("addButton").addEventListener("click", function () {
    var zoomLevel = map.getView().getZoom();
    if (zoomLevel < 12) {
      toastr.warning(
        "Your zoom level is " +
          zoomLevel +
          " Zoom level should be more than 12!",
        "Warning!"
      );
    } else {
      draw.setActive(true);

      draw.on("drawend", (e) => {
        draw.setActive(false);
        console.log(e);

        let coordinates = ol.proj.transform(
          e.feature.getGeometry().getCoordinates(),
          "EPSG:3857",
          "EPSG:4326"
        );
        xValue = coordinates[1];
        yValue = coordinates[0];

        console.log(xValue, yValue);

        var addLocPanel = $.jsPanel({
          paneltype: "modal",
          headerTitle: "Add a New Location",
          position: "center 50 50",
          theme: "#00205c",
          border: "2px solid",
          animateIn: "jsPanelFadeIn",
          animateOut: "jsPanelFadeOut",
          contentSize: "600 300",
          content:
            "<div class='MyJsPanel'>" +
            "<label for='locName'>Location Name:</label>" +
            "<input type='text' id='locName' name='locName'><br>" +
            "<label for='xCoordinate'> X Coordinate:</label>" +
            "<input type='text' id='xCoordinate' name='xCoordinate' value='' readonly><br>" +
            "<label for='yCoordinate'> Y Coordinate:</label>" +
            "<input type='text' id='yCoordinate' name='yCoordinate' value='' readonly><br>" +
            "<button id='addSubmit' class='addSubmit'>Submit</button>" +
            "</div>",
          callback: function () {
            document.getElementById("xCoordinate").value = xValue;
            document.getElementById("yCoordinate").value = yValue;
          },
          onclosed: function () {
            var x = source.getFeatures();
            var y = x.length;
            y = x[y - 1];
            source.removeFeature(y);
          },
        });

        document
          .getElementById("addSubmit")
          .addEventListener("click", function () {
            let locationname = document.getElementById("locName").value;

            if (locationname.length < 3) {
              toastr.warning(
                "The location name must be more than 2 characters.",
                "Location Name Info"
              );
              return;
            }

            //add data
            let data = {
              locationname: locationname,
              x: xValue,
              y: yValue,
            };

            fetch("https://localhost:7032/api/Location/checkAndAdd", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(data),
            })
              .then((response) => response.json())
              .then((response) => {
                if (!response.status) {
                  toastr.error(
                    "The location cannot be added. Please check the rules.",
                    "Error."
                  );
                } else {
                  toastr.success(
                    "The location is added successfully.",
                    "Success"
                  );

                  getAll();
                }
              })
              .catch((err) => {
                toastr.error(
                  "The location cannot be added.",
                  "Cannot be added."
                );
              });

            addLocPanel.close();

            getAll();
          });
      });
    }
  });

  function getAll() {
    var xValues = [];
    var yValues = [];
    // point = [];
    // pointFeature = [];

    fetch("https://localhost:7032/api/Location/getAll", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((response) => {
        if (!response.status) {
          toastr.error(response.message, "Error");
        } else {
          toastr.success(response.message, "Success.");
          for (i = 0; i < response.result.length; i++) {
            places[i] = response.result[i];
            //console.log(places[i]);

            let featureStyle = new ol.style.Style({
              image: new ol.style.Circle({
                radius: 5,
                fill: new ol.style.Fill({ color: "#00205c" }),
              }),
            });

            let coordinates = ol.proj.transform(
              [places[i].y, places[i].x],
              "EPSG:4326",
              "EPSG:3857"
            );
            let feature = new ol.Feature({
              geometry: new ol.geom.Point([coordinates[0], coordinates[1]]),
            });

            feature.setStyle(featureStyle);
            source.addFeature(feature);

            source.addFeature(
              new ol.Feature({
                geometry: new ol.geom.Point(xValues, yValues),
              })
            );
          }
        }
      })
      .catch((err) => {
        toastr.error("!!!!", "Error");
      });
  }

  getAll();

  // //AllLocation Button
  // document
  //   .getElementById("allLocations")
  //   .addEventListener("click", function () {
  //     getAll();
  //   });

  //QueryLocation Button
  document.getElementById("queryLoc").addEventListener("click", function () {
    fetch("https://localhost:7032/api/Location/getAll", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((response) => {
        if (!response.status) {
          toastr.error(response.message, "Error");
        } else {
          if (places.length < 1) {
            places = response.result;
          }
        }

        toastr.success(response.message, "Success.");
      })
      .catch((err) => {
        toastr.error("!!!!", "Error");
      });

    // for (i = 0; i < places.length; i++) {
    //   console.log(places[i]);
    // }

    setTimeout(function () {
      var allLocationsPanel = $.jsPanel({
        id: "allLocationsPanel",
        headerTitle: "All Locations",
        paneltype: "modal",
        contentSize: "550 350",
        position: "center 50 50",
        animateIn: "jsPanelFadeIn",
        animateOut: "jsPanelFadeOut",
        theme: "#00205c",
        border: "2px solid",
        content: "<table id='allLocationsTable'>" + "</table>",
      });

      $(document).ready(function () {
        var table = $("#allLocationsTable").dataTable({
          data: places,
          scrollY: 200,
          scrollX: true,
          paging: true,
          bDestroy: true,
          columns: [
            { data: "id" },
            { data: "locationname" },
            { data: "x" },
            { data: "y" },
            {
              render: function (data, type, row) {
                return (
                  "<button data-id='" +
                  row.id +
                  "' class='btnEdit'>Edit</button>"
                );
              },
            },
            {
              render: function (data, type, row) {
                return (
                  "<button data-id='" +
                  row.id +
                  "' class='btnDelete'>Delete</button>"
                );
              },
            },
          ],
        });

        $("#allLocationsTable").on("click", "tbody tr", function (evt) {
          if (evt.target.className === "btnDelete") {
            selectedRow = this;

            var deletePanel = $.jsPanel({
              id: "deletePanel",
              headerTitle: "Delete Panel",
              paneltype: "modal",
              contentSize: "150 100",
              position: "center 50 50",
              animateIn: "jsPanelFadeIn",
              animateOut: "jsPanelFadeOut",
              theme: "#00205c",
              border: "2px solid",
              content:
                "<p style = 'margin-left:10px'>Are you sure to delete?</p><br>" +
                "<button id='yesBtn' style = 'margin-left:20px'>Yes</button>" +
                "<button id='noBtn' style = 'margin-left:10px'>No</button>",
            });

            document
              .getElementById("yesBtn")
              .addEventListener("click", function () {
                $(selectedRow).remove();

                var id = $(evt.target).data("id");

                places = places.filter((x) => x.id !== id);
                deletePanel.close();

                fetch("https://localhost:7032/api/Location/" + id.toString(), {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                  },
                })
                  .then((response) => response.json())
                  .then((response) => {
                    if (!response.status) {
                      toastr.error(response.message, "Error");
                    }
                    toastr.success(response.message, "Success.");
                  })
                  .catch((err) => {
                    toastr.error("!!!!", "Error");
                  });
              });

            document
              .getElementById("noBtn")
              .addEventListener("click", function () {
                deletePanel.close();
              });
          }
          if (evt.target.className === "btnEdit") {
            selectedRow = this;

            var id = $(evt.target).data("id");
            selectedItem = places.find((x) => x.id == id);

            var editPanel = $.jsPanel({
              id: "editPanel",
              headerTitle: "Edit Panel",
              paneltype: "modal",
              contentSize: "250 250",
              position: "center 50 50",
              animateIn: "jsPanelFadeIn",
              animateOut: "jsPanelFadeOut",
              theme: "#00205c",
              border: "2px solid",
              content:
                "<div class='editPanel'>" +
                "<label for='id'> ID:</label><br>" +
                "<input type='text' id='id' name='id' value='' readonly><br><br>" +
                "<label for='locName'>Location Name:</label>" +
                "<input type='text' id='locName' name='locName'><br><br>" +
                "<label for='xCoordinate'> X Coordinate:</label>" +
                "<input type='text' id='xCoordinate' name='xCoordinate' value='' readonly><br><br>" +
                "<label for='yCoordinate'> Y Coordinate:</label>" +
                "<input type='text' id='yCoordinate' name='yCoordinate' value='' readonly><br><br>" +
                "<button id='modifyLoc' class='modifyLoc' >Modify</button>" +
                "<button id='editSubmit' class='editSubmit' style='margin-left: 5px'>Submit</button>" +
                "</div>",

              callback: function () {
                document.getElementById("id").value = selectedItem.id;
                document.getElementById("locName").value =
                  selectedItem.locationname;
                document.getElementById("xCoordinate").value = selectedItem.x;
                document.getElementById("yCoordinate").value = selectedItem.y;
              },
            });

            document
              .getElementById("modifyLoc")
              .addEventListener("click", function () {

                //seçilen noktaya zoom
                let coordinates = ol.proj.transform(
                  [selectedItem.y, selectedItem.x],
                  "EPSG:4326",
                  "EPSG:3857"
                );

                modifyLoc = [selectedItem.x, selectedItem.y];

                let feature = new ol.Feature({
                  geometry: new ol.geom.Point([coordinates[0], coordinates[1]]),
                });
                map.getView().fit(feature.getGeometry());
                map.getView().setZoom(20);

                editPanel.close();
                allLocationsPanel.close();

                //modify işlemleri buradan başlıyor
                let snap; // global so we can remove them later
                const modify = new ol.interaction.Modify({ source: source });
                map.addInteraction(modify);

                function addInteractions() {
                  map.addInteraction(draw);
                  snap = new ol.interaction.Snap({ source: source });
                  map.addInteraction(snap);
                }

                console.log(modifyLoc[0].toString(), modifyLoc[1].toString());

                addInteractions();
                modify.on("modifyend", (m) => {
                  modify.setActive(false);

                  console.log(
                    m.features.getArray()[0].getGeometry().getCoordinates()
                  );

                  let coordinates = ol.proj.transform(
                    m.features.getArray()[0].getGeometry().getCoordinates(),
                    "EPSG:3857",
                    "EPSG:4326"
                  );
                  console.log(coordinates[1], coordinates[0]);

                  fetch(
                    "https://localhost:7032/api/Location/coordinate?_x=" +
                      modifyLoc[0].toString() +
                      "&_y=" +
                      modifyLoc[1].toString(),
                    {
                      method: "GET",
                      headers: {
                        "Content-Type": "application/json",
                      },
                    }
                  )
                    .then((response) => response.json())
                    .then((response) => {
                      if (!response.status) {
                        toastr.error(response.message, "Error.");
                      } else {
                        toastr.success(response.message, "Success");
                        modifyLocName = response.result[0].locationname;
                        console.log(modifyLocName);

                        var modifyPanel = $.jsPanel({
                          headerTitle: "Modify Panel",
                          paneltype: "modal",
                          position: "center 50 50",
                          theme: "#00205c",
                          border: "2px solid",
                          animateIn: "jsPanelFadeIn",
                          animateOut: "jsPanelFadeOut",
                          contentSize: "600 300",
                          content:
                            "<div class='MyJsPanel'>" +
                            "<label for='locName'>Location Name:</label>" +
                            "<input type='text' id='locName' name='locName'><br>" +
                            "<label for='xCoordinate'> X Coordinate:</label>" +
                            "<input type='text' id='xCoordinate' name='xCoordinate' value='' readonly><br>" +
                            "<label for='yCoordinate'> Y Coordinate:</label>" +
                            "<input type='text' id='yCoordinate' name='yCoordinate' value='' readonly><br>" +
                            "<button id='Modifysubmit' class='Modifysubmit'>Submit</button>" +
                            "</div>",
                          callback: function () {
                            document.getElementById("locName").value =
                              modifyLocName;
                            document.getElementById("xCoordinate").value =
                              coordinates[1].toString();
                            document.getElementById("yCoordinate").value =
                              coordinates[0].toString();
                          },
                          onclosed: function () {
                            var x = source.getFeatures();
                            var y = x.length;
                            y = x[y - 1];
                            source.removeFeature(y);
                            getAll();
                          },
                        });

                        document
                          .getElementById("Modifysubmit")
                          .addEventListener("click", function () {
                            //edit
                            let data = {
                              id: selectedItem.id,
                              locationname:
                                document.getElementById("locName").value,
                              x: document.getElementById("xCoordinate").value,
                              y: document.getElementById("yCoordinate").value,
                            };

                            fetch(
                              "https://localhost:7032/api/Location/_location",
                              {
                                method: "PUT",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify(data),
                              }
                            )
                              .then((response) => response.json())
                              .then((response) => {
                                if (!response.status) {
                                  toastr.error(
                                    response.result.message,
                                    "Error."
                                  );
                                } else {
                                  toastr.success(
                                    response.result.message,
                                    "Success"
                                  );
                                }
                              })
                              .catch((err) => {
                                toastr.error(
                                  "The location cannot be edited.",
                                  "Cannot be added."
                                );
                              });
                            modifyPanel.close();
                          });
                      }
                    })
                    .catch((err) => {
                      toastr.error(
                        "The location cannot be added.",
                        "Cannot be added."
                      );
                    });
                });
              });

            document
              .getElementById("editSubmit")
              .addEventListener("click", function () {
                //edit
                let data = {
                  id: selectedItem.id,
                  locationname: document.getElementById("locName").value,
                  x: document.getElementById("xCoordinate").value,
                  y: document.getElementById("yCoordinate").value,
                };

                let findRow = places.find((x) => x.id == selectedItem.id);
                findRow.locationname = data.locationname;

                fetch("https://localhost:7032/api/Location/_location", {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(findRow),
                })
                  .then((response) => response.json())
                  .then((response) => {
                    if (!response.status) {
                      toastr.error(response.result.message, "Error.");
                    } else {
                      toastr.success(response.result.message, "Success");

                      document.getElementById("queryLoc").click();
                    }
                  })
                  .catch((err) => {
                    toastr.error(
                      "The location cannot be edited.",
                      "Cannot be added."
                    );
                  });
                editPanel.close();
              });
          }
        });
      });
    }, 200);
  });

  // //to change map type
  // const openStreetMapHumanitarian = new ol.layer.Tile({
  //     source: new ol.source.OSM({
  //         url: "https://{a-c}.tile.openstreetmap.fr/hot/{z}/{y}/{x}.png"
  //     }),
  //     visible: false,
  //     title: "OSMHumanitarian"
  // })

  // const stamenTerrain = new ol.layer.Tile({
  //     source: new ol.source.XYZ({
  //         url: "http://tile.stamen.com/terrain/{z}/{y}/{x}.jpg",
  //         attributions: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>'
  //     }),
  //     visible: false,
  //     title:"StamenTerrain"
  // })

  //to create layer
  //map.addLayer(openStreetMapStandard);

  // //to create layer group is like following
  // const baseLayerGroup = new ol.layer.Group({
  //     layers: [
  //     openStreetMapStandard, openStreetMapHumanitarian, stamenTerrain
  //     ]
  // })

  // map.addLayer(baseLayerGroup);

  //when click the map this function works
  //function takes the coordinate info

  // map.on("click", function(e){
  //     console.log(e.coordinate);
  // })

  // //Layer Switcher Logic for basemaps
  // const baseLayerElements = document.querySelectorAll(".sidebar > input[type=radio]");
  // console.log(baseLayerElements);
  // for(let baseLayerElement of baseLayerElements){
  //     baseLayerElement.addEventListener("change", function(){
  //         let baseLayerElementValue = this.value;
  //         baseLayerGroup.getLayers
  //     })
  // }
}
