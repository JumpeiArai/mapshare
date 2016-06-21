// MAPS main javascript

// ***TODO***
//1.setIntarvalを使わずに、watchPositionを用いてコールバックで位置更新する。
//2.socket.on記述をjsファイル分割する

//Connect Server
var socket = io.connect();


var mapmanager; // MAPS Controller
var USERID = "I am TOM";     // Local ID for identify myself

//Initialize
function initMap(){
    navigator.geolocation.getCurrentPosition(function(position){
        console.log("Succesed getting location");
        var option = {
            center:{lat:position.coords.latitude,lng:position.coords.longitude},
            zoom:16,
            disableDefaultUI: true,
            mapTypeControlOptions: {
                mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'map_style']
            },
        };
        mapmanager = new MapManager("map",option);
        socket.emit('newuserCtoS',{id : USERID, center: option.center});
    },errFunc);
    function errFunc(e){
        console.log("failed_for_"+e.code);
    }
}

function MapManager(domid,option){
    this.users = {};
    this.check_users = {};
    this.map = new google.maps.Map(document.getElementById(domid),option);
    this.stopflag = false;
    this.defaultworld_maptype = new google.maps.StyledMapType(google.maps.MapTypeId.ROADMAP);
    this.theworld_style = 
            [
            	{
            		"stylers": [
            			{ "saturation": -100 },
            			{ "gamma": 1.11 },
            			{ "visibility": "simplified" },
            			{ "invert_lightness": true }
            		]
            		},{
            		"featureType": "water",
            		"stylers": [
            			{ "color": "#ffffff" }
            		]
            		},{
            		"featureType": "road",
            		"stylers": [
            			{ "visibility": "on" },
            			{ "color": "#000000" }
            		]
            	}
            ];
    this.theworld_maptype = new google.maps.StyledMapType(this.theworld_style,{name:'theworld'});
    this.newUser = function(data){
        if(data.id===USERID || undefined){
            console.log("its me");
            var option = {
                position:data.center,
                map:this.map,
                animation: google.maps.Animation.DROP,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 6,
                    strokeColor:"#ff0000",
                    fillColor:"#ff0000"
                },
                id: data.id,
            }
        this.users[data.id] = new google.maps.Marker(option);
        console.log("ID: "+data.id+" was added");
        this.users[data.id].addListener('click',this.theWorld);
        } else {
            console.log("its other");
            var option = {
                position:data.center,
                map:this.map,
                animation: google.maps.Animation.DROP,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 6,
                    strokeColor:"#000000",
                    fillColor:"#000000"
                },
                id:data.id,
            }
        this.users[data.id] = new google.maps.Marker(option);
        console.log("ID: "+data.id+" was added");
        this.users[data.id].addListener('click',this.othMarkerEvent);
        }
    }
    
    this.clearUser = function(id){
        this.users[id].setMap(null);
        delete this.users[id];
        console.log("ID: "+id+" was removed");
    };
    this.updateUser = function(data){
        if(this.stopflag === true){return;}
        if(!this.users[data.id]){
        this.newUser(data);
        return;
        }
        this.users[data.id].setPosition(data.center);
        console.log("ID "+data.id+" has updated");
    };
    
    //Other Marker click Eventlistener
    this.othMarkerEvent = function(){
        mapmanager.check_users[this.id] = this;
        console.log(mapmanager.check_users);
    }
    
    //Self Marker click EventListener
    this.theWorld = function(){
        function worldStop(){
            console.log("world stop");
            this.map.mapTypes.set('map_style', this.theworld_maptype);
            this.map.setMapTypeId('map_style');
            this.stopflag = true;
            for(var key in this.users){
                if(key !== USERID){
                this.users[key].icon.strokeColor = "#ffffff";
                this.users[key].setMap(this.map);
                }
            }
            $('count').addClass('vis');
            count(11);
        }
        function worldStart(){
            console.log("world start");
            this.map.mapTypes.set('map_style', this.defaultworld_maptype);
            this.map.setMapTypeId('map_style');
            for(var key in this.users){
                if(key === USERID){
                this.users[key].icon.strokeColor = "#ff0000";
                }else{
                this.users[key].icon.strokeColor = "#000000";
                }
                this.users[key].setMap(this.map);
            }
            this.stopflag = false;
        }
        function count(cnt){
            if(cnt===0){
                worldStart.call(mapmanager);
                return;
            }
            cnt--;
            console.log(cnt);
            setTimeout(count,1000,cnt);
        }
        worldStop.call(mapmanager);
    };
}

function updatePosition(){
    navigator.geolocation.getCurrentPosition(function(position){
    var center = {lat:position.coords.latitude,lng:position.coords.longitude};
    var acc = position.coords.accuracy;
    socket.emit('updateUserCtoS',{id : socket.id,center:center,acc:acc})
    });
    setTimeout(updatePosition,4000);
}


//Set USERID when connected
socket.on('connect',function(){
    USERID = socket.id;
    console.log("Set "+USERID+" at local USERID");
    initMap();
});

//EventListener
socket.on('newuserStoC',function(data){
    mapmanager.newUser(data);
});
socket.on('removeuserStoC',function(id){
    mapmanager.clearUser(id);
});
socket.on('updateUserStoC',function(data){
    mapmanager.updateUser(data); 
});

setTimeout(updatePosition,6000);