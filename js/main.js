(function() {
    jQuery(function($) {

        var infowindow,
            gb_latitude,
            gb_longitude,
            gb_radius = 500,
            bounds,
            markers = [],
            map,

            // Configuration
            default_latitude = 0,
            default_longitude = 0,
            map_styles = [{"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"color":"#444444"}]},{"featureType":"landscape","elementType":"all","stylers":[{"color":"#f2f2f2"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"all","stylers":[{"saturation":-100},{"lightness":45}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#FC4B50"},{"visibility":"on"}]}],
            external_api_url = 'https://data.sfgov.org/resource/6a9r-agq8.json',
            api_app_token = '9ZEHHKeYSdawREJxAjKXmWvhn',
            google_app_key = 'AIzaSyD0FM-n0YqJLODxujxMzhK3mfIx3hTKqCo',
            default_zoom_level = 5,
            marker_image_path = 'images/marker.png';

        FoodTruckDemo = {

            init: function() {
                this.loadBindings();
            },

            loadBindings: function() {
                var thisApp = this;

                $('#range-bar').on('change', function() {
                    document.getElementById("range").innerHTML = this.value + ' Meter';
                    gb_radius = parseInt(this.value);
                    thisApp.loadData(gb_latitude, gb_longitude, gb_radius);
                });

                $('#food-filter').submit(function(event) {
                    event.preventDefault();
                    thisApp.loadData(gb_latitude, gb_longitude, gb_radius, $('#food-item').val().toLowerCase());
                });

                $('#clear-food-items').on('click', function(event) {
                    event.preventDefault();
                    if (!!$('#food-item').val()) {
                        $('#food-item').val('');
                        thisApp.loadData(gb_latitude, gb_longitude, gb_radius);
                    }
                });

                $('#reset').on('click', function(event) {
                    event.preventDefault();
                    $('#pac-input').val('');
                    $('#food-item').val('');
                    thisApp.noDataFound(0,0);
                });

                map = new google.maps.Map(document.getElementById('map'), {
                    zoom: default_zoom_level,
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    styles: map_styles
                });

                infowindow = new google.maps.InfoWindow();
                bounds = new google.maps.LatLngBounds();

                setTimeout(function () {
                    thisApp.filterData(); 
                    thisApp.bindSearchBOx(); 
                    thisApp.dynamicHeightToElements(); 
                }, 500);
            },

            filterData: function() {
                var thisApp = this;

                if ("geolocation" in navigator) {
                    navigator.geolocation.getCurrentPosition(function(position) { 
                        thisApp.identifyCurrentLocationName(position.coords.latitude, position.coords.longitude);
                        thisApp.loadData(position.coords.latitude, position.coords.longitude);
                    }, function() {
                        thisApp.noDataFound(default_latitude, default_longitude);
                    });
                }
            },

            loadData: function(latitude, longitude, radius, searchedTerm) {
                var thisApp = this;

                gb_latitude = latitude,
                gb_longitude = longitude;

                if (!radius) {
                    radius = gb_radius;
                }

                $.ajax({
                    url: external_api_url + '?facilitytype=Truck&$where=within_circle(location, '+latitude+', '+longitude+', '+radius+')',
                    type: "GET",
                    data: {
                      "$$app_token" : api_app_token
                    }
                }).done(function(data) {
                    console.log("Retrieved " + data.length + " records from the dataset!");
                    if (data.length > 0) {
                        if (searchedTerm) {
                            var filteredData = $.grep(data, function (e) {
                                if (e.fooditems) {
                                    return e.fooditems.indexOf(searchedTerm) > 0;
                                }
                            }); 
                            thisApp.handleData(filteredData);
                        } else {
                            thisApp.handleData(data);
                        }
                    } else {
                        thisApp.noDataFound(latitude, longitude);
                    }
                });
            },

            handleData: function(response) {
                
                // Before adding new markers, Clear out the old markers.
                markers.forEach(function(marker) {
                    marker.setMap(null);
                });

                markers = [];
                $('.search-results').empty();

                for(var n=0; n<response.length; n++) {
                    if (response[n].latitude != 0 && response[n].longitude != 0) {
                        name = response[n].applicant ? response[n].applicant : 'N/A';
                        address = response[n].address ? response[n].address : 'N/A';
                        facilitytype = response[n].facilitytype ? response[n].facilitytype : 'N/A';
                        fooditems = response[n].fooditems ? response[n].fooditems : 'N/A';
                        dayshours = response[n].dayshours ? response[n].dayshours : 'N/A';
                        locationdescription = response[n].locationdescription ? response[n].locationdescription : 'N/A';
                        lat = response[n].latitude;
                        lon = response[n].longitude;

                        var contentString = '<div class="food-truck-info"><h3 class="applicant">'+name+'</h3><p class="fooditems"><span>Food Items: </span>'+fooditems+'</h3><p class="dayshours"><span>Working Hours: </span>'+dayshours+'</h3><p class="address"> <span>Address: </span> '+address+'</h3></div>';

                        var myLatLng = new google.maps.LatLng(lat,lon),
                            marker = new google.maps.Marker({
                                position: myLatLng,
                                map: map,
                                title: name,
                                zIndex: 1,
                                html: contentString,
                                icon: marker_image_path,
                            });

                        markers.push(marker);

                        bounds.extend(marker.position);

                        google.maps.event.addListener(marker, 'click', function () {
                            infowindow.setContent(this.html);
                            infowindow.open(map, this);
                        });

                        // Add data into the search result box

                        $('.search-results').append('<div class="food-truck-info"><h3 class="applicant">'+name+'</h3><p class="fooditems"><span>Food Items:</span>'+fooditems+'</h3><p class="dayshours"><span>Working Hours:</span>'+dayshours+'</h3><p class="address"> <span>Address:</span> '+address+'</h3></div>')
                    }

                    map.fitBounds(bounds);
                }
            },

            bindSearchBOx: function() {
                var thisApp = this,
                    input = document.getElementById('pac-input'),
                    searchBox = new google.maps.places.SearchBox(input);

                // Bias the SearchBox results towards current map's viewport.
                map.addListener('bounds_changed', function() {
                    searchBox.setBounds(map.getBounds());
                });

                // Listen for the event fired when the user selects a place.
                searchBox.addListener('places_changed', function() {
                    var places = searchBox.getPlaces();

                    if (places.length == 0) {
                        return;
                    }

                    places.forEach(function(place) {
                        if (!place.geometry) {
                            console.log("Returned place contains no geometry");
                            return;
                        }
                        thisApp.loadData(parseFloat(places[0].geometry.location.lat()), parseFloat(places[0].geometry.location.lng()));
                    });
                });
            },

            noDataFound: function(latitude, longitude) {
                map = new google.maps.Map(document.getElementById('map'), {
                    center: {lat: latitude, lng: longitude},
                    zoom: default_zoom_level,
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    styles: map_styles
                });
                $('.search-results').html('<div class="food-truck-info"><h3 class="applicant no-result">No food trucks found.</div>');
            },

            dynamicHeightToElements: function() {
                $('body').css({
                   'min-height' : $(window).height()
                });

                $('#search-result .search-results').css({
                   'height' : $(window).height() - ( $('.action-buttons').outerHeight() + $('.title-wrapper').outerHeight() )
                });
            },

            identifyCurrentLocationName: function(latitude, longitude) {
                $.ajax({
                    url: 'https://maps.googleapis.com/maps/api/geocode/json?latlng='+latitude+','+longitude+'&key='+google_app_key,
                    type: "GET"
                }).done(function(location) {
                    $('#pac-input').val(location.results[0].address_components[2].long_name);
                });
            }
        };

        FoodTruckDemo.init();

    });
})();
