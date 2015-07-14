var map,maker;			//map関連変数
var defaultPosition;	//初期位置
var lang;
var preset = [["東京",35.680865,139.767036,13]];
function load(){
	defaultPosition = new google.maps.LatLng(37,136);	
	
	lang = lang_get_syori();
	var get = GetQueryString();
	if(get["lat"]&&get["lng"]&&get["zoom"]){
		map_latlng_set_make(get["lat"],get["lng"],eval(get["zoom"]));
	}else{
		map_make();
	}
	document.getElementById("lang").value = lang;
	if(lang == "en"){
		document.getElementById("lang_select").innerHTML = "Language:";
		document.getElementById("msg").innerHTML = "Please move the center of the map to the place where you'd like to know the weather.";
		document.getElementById("syutoku").value = "Decision !";
		document.getElementById("preset_move").value = "move";
		document.getElementById("preset_delete").value = "delete";
		document.getElementById("preset_plus").value = "add";
		document.getElementById("preset_name").placeholder = "Favorites";
		document.getElementById("favo_message").innerHTML = "Favorites";
	}
	if(localStorage.preset == undefined){
		preset = [["東京",35.680865,139.767036,13]];
	}else{
		preset = JSON.parse(localStorage.preset);
		option_chg();
	}
}
function map_make(){
	map_latlng_set_make(38,139,5);
}
function map_latlng_set_make(lat,lng,zoom){
	var latlng = new google.maps.LatLng(lat,lng);
	var opts = {
		zoom: zoom,
		center: latlng,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	map = new google.maps.Map(document.getElementById("map"), opts);
}
function map_latlng_get(){
	var center = map.getCenter();
	var lat = center.lat();
	var lng = center.lng();
	var zoom = map.getZoom();
	location.href = "../index.php?lat="+lat+"&lng="+lng+"&lang="+lang+"&zoom="+zoom;
}
function lang_get_syori(){
	var result = GetQueryString();
	var lang = result["lang"];
	if(lang == "ja" || lang == "en") return lang;
	return "ja";
}
function GetQueryString(){
	var result = {};
	if( 1 < window.location.search.length ){
		// 最初の1文字 (?記号) を除いた文字列を取得する
		var query = window.location.search.substring( 1 );
		// クエリの区切り記号 (&) で文字列を配列に分割する
		var parameters = query.split( '&' );
		for( var i = 0; i < parameters.length; i++ ){
			// パラメータ名とパラメータ値に分割する
			var element = parameters[ i ].split( '=' );
			var paramName = decodeURIComponent( element[ 0 ] );
			var paramValue = decodeURIComponent( element[ 1 ] );
			// パラメータ名をキーとして連想配列に追加する
			result[ paramName ] = paramValue;
		}
	}
	return result;
}
function lang_chg(){
	var center = map.getCenter();
	var lat = center.lat();
	var lng = center.lng();
	var zoom = map.getZoom();

	document.location = "./?lang="+document.getElementById("lang").value+"&lat="+lat+"&lng="+lng+"&zoom="+zoom;
}
function toTokyo() {
	topreset(35.680865,139.767036,13);
}
function topreset(lat,lng,zoomlevel){
	map.setZoom(zoomlevel);
	map.panTo(new google.maps.LatLng(lat,lng));
}
function preset_cont(){
	var num = document.getElementById("preset_select").value;
	topreset(preset[num][1],preset[num][2],preset[num][3]);
}
function preset_plus(){
	var center = map.getCenter();
	var lat = center.lat();
	var lng = center.lng();
	var zoom = map.getZoom();
	var name = document.getElementById("preset_name").value;
	if(name == ""){
		alert("名前が空です。");
		return 1;
	}
	preset.push([name,lat,lng,zoom]);
	var preset_hairetu_num = preset.length - 1;
	var preset_num = document.getElementById("preset_select").options.length;
	document.getElementById("preset_select").options[preset_num] = new Option(name,preset_hairetu_num);
	//alert(preset)
	localStorage.preset = JSON.stringify(preset);
}
function debug_mode(){
	console.log(preset)
}
function option_chg(){
	for(var i = 0;preset.length > i;i++){
		document.getElementById("preset_select").options[i] = new Option(preset[i][0],i);
	}
}
function preset_delete(){
	var num = document.getElementById("preset_select").value;
	if(confirm("本当に\"" + preset[num][0] + "\"の設定を削除しますか？")){
		preset.splice(num,1);
		localStorage.preset = JSON.stringify(preset);
		location.reload()
	}
}
function preset_init(){
	if(confirm("本当に全ての設定を削除しますか？")){
		localStorage.removeItem("preset");
	}
}
function addresssearch_address(){
	var address = document.getElementById("addresssearch_address").value;
	address = address.replace(" ","+");
	if(address == "") alert("住所を入力してください");
	var geocoder = new google.maps.Geocoder();
	geocoder.geocode(
		{
			'address': address,
			'language': 'ja'
		},
		function(results, status){
			if(status==google.maps.GeocoderStatus.OK){
				var zoom = map.getZoom();
				var bounds = new google.maps.LatLngBounds();
				var marker = [];
				for (var i in results) {
					if (results[i].geometry) {
						// 緯度経度を取得
						var latlng = results[i].geometry.location;
						// 住所を取得(日本の場合だけ「日本, 」を削除)
						var address = results[i].formatted_address.replace(/^日本, /, '');
						// 検索結果地が含まれるように範囲を拡大
						bounds.extend(latlng);
						// あとはご自由に・・・。
						/*new google.maps.InfoWindow({
							content: address + "<br>(Lat, Lng) = " + latlng.toString()
						}).open(map, new google.maps.Marker({
							position: latlng,
							map: map
						}));*/
						marker.push(latlng);
						new google.maps.Marker({
							position: latlng,
							map: map
						});
					}
				}
				// 範囲を移動
				map.fitBounds(bounds);
				var center = map.getCenter();
				var lat = center.lat();
				var lng = center.lng();
				var new_zoom = map.getZoom();
				if(new_zoom < zoom){
					zoom = new_zoom;
				}
				var latlng = new google.maps.LatLng(lat,lng);
				var opts = {
					zoom: zoom,
					center: latlng,
					mapTypeId: google.maps.MapTypeId.ROADMAP
				};
				map = new google.maps.Map(document.getElementById("map"), opts);
				for(var i = 0;marker.length > i;i++){
					new google.maps.Marker({
						position: marker[i],
						map: map
					});
				}
				if(marker.length == 0) alert("場所が見つけられませんでした");
			}
		}
	);
}