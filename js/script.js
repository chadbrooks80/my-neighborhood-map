var map;
var largeInfoWindow;

//used to initialize the map
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 39.6813, lng: -105.0559   },
        zoom: 11
    });

    //create infoWindow object
    largeInfoWindow = new google.maps.InfoWindow();

    //create new markers and place into observable array
    for (var i=0; i < data.length; i++) {

        var marker = new google.maps.Marker({
            map: map,
            location: data[i].location,
            title: data[i].title,
            id: data[i].id
        });
        //set marker to the lat lng and add marker to vm.
        marker.setPosition(data[i].location);
        vm.markers.push(marker);
        vm.markerData.push(
            {
                title: data[i].title,
                id: data[i].id
            }
        );

        //upon click, will display the infoWindow
        marker.addListener('click', function() {
            showInfoWindow(this, largeInfoWindow);
        });
    }
}

//view model for ko
var vm = {
    self: this,
    //when set to true, the side menu bar is displayed
    maxSideBar: ko.observable(true),
    //holds the details of the marker to use for filtering and clicking on menu
    markerData: ko.observableArray(),
    //holds each marker created in the initMap function
    markers: [],
    //text for this is bound in the filter input
    filter: ko.observable(""),
    //this is used when user clicks on one of the listings to show info window
    displayInfoWindow: function() {
        //first finds the marker from the marker data.
        var marker = findMarker(this.id);
        showInfoWindow(marker, largeInfoWindow);
    },
    //this function is used for someone clicking on the expand or collaps button for
    //the side menu
    sidebarToggle: function() {
        if (this.maxSideBar()) {
            this.maxSideBar(false);
        } else {
            this.maxSideBar(true);
        }
    }
}

//closed javascript function used to filter results.
vm.filterResults =  function(data) {
    return ko.computed(function() {
        var id = data.id;
        var title = data.title.toLowerCase();
        var filter = vm.filter().toLowerCase();
        var marker = findMarker(data.id);

        //when the map is still loading it may not find the marker right away
        //this will test that and just set to true until the markers are all loaded
        if (marker == false){
            return true;
        }

        if (vm.filter() == "") {
            marker.setMap(map);
            return true;
        }
        // -1 means no search found
        if (title.search(filter) != -1) {
            marker.setMap(map);
            return true;
        }

        //else it sets marker on map to null.
        marker.setMap(null);
        return false;
    }, this);
};

ko.applyBindings(vm);

//used to display infowindow when list or marker is clicked
function showInfoWindow(marker, infoWindow) {
    //FOURSQUARE DETAILS
var clientId = 'UVH2XVQVKG32VB0D1SAHCKLIS1VQQBDHUDHCA43WMNJ04VMY';
var clientSecret = 'F1EIWBO14JZDDY3QSY5MOAE3FJYJ0ID43FSJNAIM1MRDUOH2';
var latLng = marker.location.lat + "," + marker.location.lng;
var url = "https://api.foursquare.com/v2/venues/search?limit=1&v=20170413" +
    "&ll=" + latLng +
    "&client_id=" + clientId +
    "&client_secret=" + clientSecret;
    infoWindow.marker = marker;
infoWindow.setContent(
    '<div>' + marker.title + '</div>'
);

//make marker bounce
marker.setAnimation(google.maps.Animation.BOUNCE);
setTimeout(function() {
marker.setAnimation(null);
}, 3000);

infoWindow.open(map, marker);
// Make sure the marker property is cleared if the infoWindow is closed.
infoWindow.addListener('closeclick',function(){
    infoWindow.setMarker = null;

});

    //ajax is called for four square
    var fourSqrData;
    $.ajax({
        method: "get",
        url: url,
        dataType: "json",
        timeout: 3000,
        success: function(data) {
            $.each(data, function() {
                var fsq = data.response.venues[0];
                var address = fsq.location.formattedAddress[0] || 'Address was not provided';
                var cityState = fsq.location.formattedAddress[1] || 'City/State was not Provided';
                var phone = fsq.contact.formattedPhone || 'A Phone # was not provided';

                //gets results and posts to infoWindow
                infoWindow.setContent(
                    '<div>' + marker.title + '</div>' +
                    '<div>' + address +
                    '<div>' + cityState + '</div>' +
                    '<div>' + phone + '</div>'
                );
            });
        }, //error if not able to conect to foursqare
        error: function() {
            alert("There was an error retreiving data from FourSquare, Please try again later!");
        }
    });
}

//used to search for marker and return it. search is based upon finding the id
function findMarker(id) {

    for (var i=0; i < vm.markers.length; i++) {
        if (vm.markers[i].id == id) {
            return vm.markers[i];
        }
    }
    return false;
}

//error to run if map does not load.  if this is the case the entire screen is replaced with error message.
function mapError() {
    document.write("There was an error loading the map, please try Refreshing your browser and try again");
}