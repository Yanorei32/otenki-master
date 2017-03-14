//読み込みが完了したか
var load_ok = false;
//言語
var lang;
//地図表示関連
var map,maker,defaultPosition;
//座標
var lat,lng;
//座標が手動設定によるものか
var zahyou_manual = false;
//読み上げ中か
var yomiage_flag = false;
//WAVが再生可能か
var wav_ok = true;
//ブラウザが回転に対応しているか
var transform = true;
//TDの背景色
var td_background_color = "#C4FD84";
//声用,OP用,ドラム用Audio
var audio = new Audio();
var opening_audio = new Audio();
var drum_audio = new Audio();
//読み上げのテキストの配列
var yomiage_text_hairetu = [];
//読み上げた回数
var yomiage_count = 0;
//エンコーダーのワーカー
var worker_libmp3lame = new Worker('./js/encoder.js');
function load_(){
	//ブラウザが回転に対応しているかの判定&対応していなかった場合の対応
	var style = document.createElement('div').style,
	supported = 0;
	if( 'transform' in style ) {
		style.transform = 'rotateY(100deg)';
		supported = style.transform === '' ? 1 : 2;
	}
	//言語の設定
	lang = lang_get_syori();
	//WAVEファイル(読み上げのファイル)の再生に対応しているか&対応していなかった場合の対応
	if(audio.canPlayType("audio/wav") != "maybe" && audio.canPlayType("audio/wav") != "probably"){
		if(lang == "ja") alert("警告：このブラウザの場合、十分なパフォーマンスを発揮できない可能性があります。");
		if(lang == "en") alert("Warning : In the case of this browser , there is a possibility that you can not exert sufficient performance.");
		wav_ok = false;
	}
	//mp3が対応しているか&対応していなかった場合WAVに
	if(audio.canPlayType("audio/mp3") == "maybe" || audio.canPlayType("audio/mp3") == "probably" ){
		opening_audio.src = "./audio/op_new.mp3";
		drum_audio.src = "./audio/drum.mp3";
	}else{
		opening_audio.src = "./audio/op_new.wav";
		drum_audio.src = "./audio/drum.wav";
	}
	//音声の設定
	drum_audio.preload = "auto";
	drum_audio.volume = 0.5;
	opening_audio.preload = "auto";
	opening_audio.volume = 0.6;
	audio.volume = 1;
	//Selectの初期化
	document.getElementById("lang").value = lang;
	//英語のページ設定
	if(lang == "en"){
		document.getElementById("lang_select").innerHTML = "Language:";
		document.getElementById("page_title").innerHTML = "Weather forecast";
		document.getElementById("logo").src = "./img/LOGO_en.png";
	}
	//デフォルトの座標を設定
	defaultPosition = new google.maps.LatLng(37,136);
	//HTMLの取得の準備
	var html = new XMLHttpRequest();
	//Windowサイズの比較
	if(window.innerWidth < window.innerHeight){
		//縦長のHTMLを取得
		html.open("GET","main_html/tatenaga_"+lang+".html",true);
	}else{
		//横長のHTMLを取得
		html.open("GET","main_html/yokonaga_"+lang+".html",true);
	}
	html.send(null);
	//読み込み時に読み込まれる関数
	html.onload = function(){
		//読み込んだHTMLを表示
		document.getElementById("main").innerHTML = this.responseText;
		if(supported == 0){
			transform = false;
			alert("TRANSFORMにこのブラウザが対応していないため風向きの表示がおかしくなります");
		}else{
			transform = true;
		}
		//URLからの座標取得ができなかった
		if(get_syori() == "error"){
			//座標のブラウザからの取得
			if (navigator.geolocation){
				navigator.geolocation.getCurrentPosition(
					function(position){
						//経度・緯度の取得
						lat = position.coords.latitude;
						lng = position.coords.longitude;
						//取得した座標をもとに、地図を表示
						map_make(lat,lng);
						//経度・緯度の表示
						document.getElementById("lat").innerHTML = lat.toFixed(3);
						document.getElementById("lng").innerHTML = lng.toFixed(3);
						//取得した経度・緯度を天気予報のAPIに受け渡し。
						weather_get(lat,lng);
						//取得した経度・緯度をGoogleMapのAPIに受け渡し。
						var currentPosition =  new google.maps.LatLng(lat,lng);
						map.setCenter(currentPosition);
						maker.setPosition(currentPosition);
					},function(error){
						//座標取得時にエラーが発生した場合
						if(lang == "ja") alert("エラーが発生しました\n" + error);
						if(lang == "en") alert("Occurrence of an error.\n" + error);
						error_confirm();
					},{
						//Android用の座標のクオリティを上げるためのオプション
						enableHighAccuracy:  true
					}
				);
			}else{
				//Geolocationに対応していない場合のエラー
				if(lang == "ja") alert("ご使用のブラウザでは、geolocationに対応していません。");
				if(lang == "en") alert("Your browser does not support Geolocation.");
				error_confirm();
			}
		}else{
			//URLからの座標の取得
			var get = get_syori();
			lat = get[0];
			lng = get[1];
			zoom = get[2];
			//経度・緯度の表示
			document.getElementById("lat").innerHTML = lat;
			document.getElementById("lng").innerHTML = lng;
			zahyou_manual = true;
			//取得した経度・緯度を天気予報のAPIに受け渡し。
			weather_get(lat,lng);
			map_make(lat,lng,zoom);
			//取得した経度・緯度をGoogleMapのAPIに受け渡し。
			var currentPosition =  new google.maps.LatLng(lat,lng);
			map.setCenter(currentPosition);
			maker.setPosition(currentPosition);
		}
	}
}
function weather_get(lat,lon){
	//新しいXMLリクエストを作成
	var httpObj = new XMLHttpRequest();
	//経度・緯度を入れ、URLを変数に
	var url = "http://api.openweathermap.org/data/2.5/forecast/daily?lat="+lat+"&lon="+lon+"&mode=json&cnt=8";
	//URLを取得
	httpObj.open("GET",url,true);
	//取得したもののURLを表示
	if(lang == "ja") var link = "<a href='"+url+"'>こちらのJSON</a>";
	if(lang == "en") var link = "<a href='"+url+"'>This JSON</a>";
	document.getElementById("link").innerHTML = link;
	httpObj.send(null);
	httpObj.onload = function(){
		//JSONを変換
		var data = JSON.parse(this.responseText);

		//国名・都市名を変数に
		var city_name = data.city.country + "/" + data.city.name;
		//国名・都市名を表示
		document.getElementById("toshi").innerHTML = city_name;

		//tableの用意
		table_make();
		//全てのlistの内容を周回するためのfor文
		for(var i = 0;i < data.list.length;i++){

			//時刻データ取得及び作成
			var dt = new Date ( data.list[i].dt * 1000 );
			//月の取得
			var mon = dt.getMonth() + 1;
			//日の取得
			var day = dt.getDate();
			//曜日の取得
			var week = num_to_week(dt.getDay());
			if(lang == "ja"){
				//表示用の日付を作成
				var disp_date = mon + "月" + day + "日" + week + "曜日";
				if(i == 0){
					yomiage_text_hairetu[i] =  "今日";
				}else if(i == 1){
					yomiage_text_hairetu[i] =  "明日";
				}else if(i == 2){
					yomiage_text_hairetu[i] =  "あさって";
				}else if(i == 3){
					yomiage_text_hairetu[i] =  "しあさって";
				}else{
					yomiage_text_hairetu[i] =  day + "日";
				}
			}
			if(lang == "en"){
				//表示用の日付を作成
				var disp_date = mon_to_en(mon) + day + "&nbsp;" +week;
				if(i == 0){
					yomiage_text_hairetu[i] = "to";
				}else{
					yomiage_text_hairetu[i] = day;
				}
			}
			//日付をtableに
			if(lang == "en") if(i == 0) document.getElementById("d"+i+"-dt").innerHTML = "<font size='2'>Today</font><br>";
			document.getElementById("d"+i+"-dt").innerHTML += disp_date;

			//天気のアイコンのURLの取得
			var weather_ico = "http://openweathermap.org/./img/w/" + data.list[i].weather[0].icon + ".png";
			//天気のアイコンの反映
			document.getElementById("d"+i+"-tenki_icon").src=weather_ico;
			//天気の取得
			if(lang == "ja") var weather = e_to_j(data.list[i].weather[0].main);
			if(lang == "en") var weather = data.list[i].weather[0].main;
			//天気をtableに
			document.getElementById("d"+i+"-tenki_mozi").innerHTML = weather;
			//天気を読み上げ用変数に追加
			if(lang == "ja") yomiage_text_hairetu[i] += "の天気は、" + weather + "です。";
			if(lang == "en") yomiage_text_hairetu[i] += "day's weather is " + weather;

			//風速及び風向きを取得
			var deg = data.list[i].deg;
			var speed = data.list[i].speed;
			//角度を方角に変換
			var direction = wind_deg(deg);
			//画像相対パス取得
			if(transform) document.getElementById("d"+i+"-kaze_ico").src = speed_src(speed);
			//画像角度設定
			if(transform) document.getElementById("d"+i+"-kaze_ico").style.transform = "rotate("+deg+"deg)";
			//速度を書きこみ
			if(lang == "ja")document.getElementById("d"+i+"-kaze_mozi").innerHTML = speed + "m/s・" + direction[0];
			if(lang == "en")document.getElementById("d"+i+"-kaze_mozi").innerHTML = speed + "m/s<br>" + direction[0];
			//速度を読み上げ用変数に追加
			if(lang == "ja") yomiage_text_hairetu[i] += direction[1]+"の風、秒速" + speed + "メートル。";
			if(lang == "en") yomiage_text_hairetu[i] += "Wind from the " + direction[1] + speed + "meter Per second";

			//今日の気温を取得及び単位の修正
			var day = temp_calc(data.list[i].temp.day);
			//今日の気温をtableに
			if(lang == "ja") document.getElementById("d"+i+"-kion").innerHTML = day + "度";
			if(lang == "en") document.getElementById("d"+i+"-kion").innerHTML = day + "deg";
			//気温を読み上げ用変数に追加
			if(lang == "ja") yomiage_text_hairetu[i] += "日中の気温は、" + day + "度。";
			if(lang == "en") yomiage_text_hairetu[i] += "Temperature during the day is " + day + "degrees";

			//今日の最低気温を取得及び単位の修正
			var min = temp_calc(data.list[i].temp.min);
			//今日の最低気温をtableに
			if(lang == "ja") document.getElementById("d"+i+"-saitei").innerHTML = min + "度";
			if(lang == "en") document.getElementById("d"+i+"-saitei").innerHTML = min + "deg";
			//最低気温を読み上げ用変数に追加
			if(lang == "ja") yomiage_text_hairetu[i] += "最低気温は、" + min + "度。";
			if(lang == "en") yomiage_text_hairetu[i] += "Minimum temperature is " + min + "degrees";

			//今日の最高気温を取得及び単位の修正
			var max = temp_calc(data.list[i].temp.max);
			//今日の最高気温をtableに
			if(lang == "ja") document.getElementById("d"+i+"-saikou").innerHTML = max + "度";
			if(lang == "en") document.getElementById("d"+i+"-saikou").innerHTML = max + "deg";
			//最高気温を読み上げ用変数に追加
			if(lang == "ja") yomiage_text_hairetu[i] += "最高気温は、" + max + "度です。";
			if(lang == "en") yomiage_text_hairetu[i] += "Maximum temperature is " + max + "degrees";

			//気圧の取得
			var pressure = round_calc(data.list[i].pressure);
			//気圧をtableに
			document.getElementById("d"+i+"-kiatu").innerHTML = pressure + "hpa";

			//湿度の取得
			var humidity = data.list[i].humidity + "%";
			if(humidity == "0%") humidity = "-";
			//湿度をtableに
			document.getElementById("d"+i+"-situdo").innerHTML = humidity;
		}

		//作業完了の報告
		hiduke_click(0);
		load_ok = true;
	}
}
function temp_calc(temp){
	//ケルビン温度をセルシウス度に変換し、四捨五入する
	return round_calc( temp - 273.15 );
}
function round_calc(x){
	//小数点第2を四捨五入
	return Math.round( x * 10 ) / 10;
}
function table_make(){
		//divの内容になるHTML用の変数
		var div_table = "";
		if(lang == "ja"){
			//tableの作成V2
			div_table += "<table border = '1' id='itiran'>";
				div_table += "<tr>";
					div_table += "<td class='hiduke_title_td'>日付</td>";
					div_table += "<td>天気</td>";
					div_table += "<td>風</td>";
					div_table += "<td>日中気温</td>";
					div_table += "<td class='saitei_kion_title_td'>最低気温</td>";
					div_table += "<td class='saikou_kion_title_td'>最高気温</td>";
					div_table += "<td>気圧</td>";
					div_table += "<td class='situdo_title_td'>湿度</td>";
				div_table += "</tr>";
				//必要日数分の表を用意
				for(var i = 0; i < 8; i++){
					div_table += "<tr>";
						div_table += "<td id='d"+ i +"-dt' onclick='hiduke_click("+ i +")' class='hiduke_td'></td>";//日付
						div_table += "<td id='d"+ i +"-tenki' class='tenki_td'><table><tr><td class='tenki_mozi_td'><span id='d"+ i +"-tenki_mozi'></span></td><td><img src='' id='d"+ i +"-tenki_icon' class='tenki_icon'></td></tr></table></td>";//天気
						if(transform) div_table += "<td id='d"+ i +"-kaze' class='kaze_td'><img src='' id='d"+ i +"-kaze_ico' class='kaze_ico'><br><span id='d"+ i +"-kaze_mozi' class='kaze_mozi'></span></td>";//風
						if(!transform) div_table += "<td id='d"+ i +"-kaze' class='kaze_td'><span id='d"+ i +"-kaze_mozi' class='kaze_mozi'></span></td>";//風
						div_table += "<td id='d"+ i +"-kion' class='kion_td'></td>";//気温
						div_table += "<td id='d"+ i +"-saitei' class='saitei_kion'></td>";//最低気温
						div_table += "<td id='d"+ i +"-saikou' class='saikou_kion'>";//最高気温
						div_table += "<td id='d"+ i +"-kiatu' class='kiatu_td'></td>";//気圧
						div_table += "<td id='d"+ i +"-situdo' class='situdo_td'></td>";//湿度
					div_table += "</tr>";
				}
			div_table += "</table>";
		}
		if(lang == "en"){
			//tableの作成V2
			div_table += "<table border = '1' id='itiran'>";
				div_table += "<tr>";
					div_table += "<td class='hiduke_title_td'>Date</td>";
					div_table += "<td>Weather</td>";
					div_table += "<td>Wind</td>";
					div_table += "<td>Daytime</td>";
					div_table += "<td class='saitei_kion_title_td'>Minimum</td>";
					div_table += "<td class='saikou_kion_title_td'>Maximum</td>";
					div_table += "<td>pressure</td>";
					div_table += "<td class='situdo_title_td'>Humidity</td>";
				div_table += "</tr>";
				//必要日数分の表を用意
				for(var i = 0; i < 8; i++){
					div_table += "<tr>";
						div_table += "<td id='d"+ i +"-dt' onclick='hiduke_click("+ i +")' class='hiduke_td'></td>";//日付
						div_table += "<td id='d"+ i +"-tenki' class='tenki_td'><table><tr><td class='tenki_mozi_td'><span id='d"+ i +"-tenki_mozi'></span></td><td><img src='' id='d"+ i +"-tenki_icon' class='tenki_icon'></td></tr></table></td>";//天気
						if(transform) div_table += "<td id='d"+ i +"-kaze' class='kaze_td'><img src='' id='d"+ i +"-kaze_ico' class='kaze_ico'><br><span id='d"+ i +"-kaze_mozi' class='kaze_mozi'></span></td>";//風
						if(!transform) div_table += "<td id='d"+ i +"-kaze' class='kaze_td'><span id='d"+ i +"-kaze_mozi' class='kaze_mozi'></span></td>";//風
						div_table += "<td id='d"+ i +"-kion' class='kion_td'></td>";//気温
						div_table += "<td id='d"+ i +"-saitei' class='saitei_kion'></td>";//最低気温
						div_table += "<td id='d"+ i +"-saikou' class='saikou_kion'>";//最高気温
						div_table += "<td id='d"+ i +"-kiatu' class='kiatu_td'></td>";//気圧
						div_table += "<td id='d"+ i +"-situdo' class='situdo_td'></td>";//湿度
					div_table += "</tr>";
				}
			div_table += "</table>";
		}
		//tableの書きこみ
		document.getElementById("tenki").innerHTML = div_table;
}
function num_to_week(num){
	//曜日を入れる変数を用意
	var week;
	var week_char = [];
	//数字からの曜日文字への変換
	if(lang == "ja"){
		week_char = ["日","月","火","水","木","金","土"];
	}else if(lang == "en"){
		week_char = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
	}
	return week_char[num];;
}
function e_to_j(eng){
	var ja = "";
	switch(eng){
		case "Clear":
			ja = "晴れ";
			break;
		case "Clouds":
			ja = "曇り";
			break;
		case "Rain":
			ja = "雨";
			break;
		case "Snow":
			ja = "雪";
			break;
	}
	return ja;
}
function speed_src(speed){
	//風の速度によって、表示矢印のリンクを変えるのでそのパスをリターン
	if(speed < 3){
		return "./img/01_.png";
	}else if(speed < 6){
		return "./img/02_.png";
	}else if(speed < 9){
		return "./img/03_.png";
	}else if(speed < 12){
		return "./img/04_.png";
	}else if(speed < 15){
		return "./img/05_.png";
	}else{
		return "./img/ex.png";
	}
}
function yomiage_api(num){
	//読み上げテキスト最終加工&読み上げ関数呼び出し
	if(lang == "en"){
		lang = "en";
	}else if(lang == "ja"){
		num = num.replace(/\-/g,"マイナス");
	}
	playVoice(lang,num);
}
function playVoice(language, message){
	yomiage_count++;
	yomiage_flag = true;
	$.ajax( {
		url : "http://rospeex.ucri.jgn-x.jp/nauth_json/jsServices/VoiceTraSS",
		data : {
			method : "speak",
			params : [language, message, "*", "audio/x-wav"]
		},
		dataType : 'jsonp',
		jsonp : 'callback',
		cache : false,
		success : function(data) {
			console.log(data);
			audio_data = data['result']['audio'];
			if( data['error'] == null ) start_audio_play();
		},error : function(XMLHttpRequest, status, errorThrown) {
			console.log(status);
			console.log(errorThrown);
			console.log(XMLHttpRequest);
		},complete : function(XMLHttpRequest, status) {
			if( status != "success" ) {
				console.log("Voicetra Server Error : ", status);
			}
		}
	});
}
function map_make(lat,lng,zoom){
	if(zoom == undefined) zoom = 13;
	map = new google.maps.Map(document.getElementById("map"),{
		//地図の拡大率の指定
		zoom : zoom,

		center : defaultPosition,
		mapTypeId : google.maps.MapTypeId.ROADMAP
	});
	maker = new google.maps.Marker({
		position: defaultPosition,
		map: map
	});
}
function hiduke_click(hiduke){
	if(!yomiage_flag){
		document.getElementById("d"+hiduke+"-dt").style.backgroundColor = "#3DAC00";
		yomiage_api(yomiage_text_hairetu[hiduke]);
	}
}
function audio_stop(){
	//読み上げ中であることを示す変数を戻す
	audio.pause();
	drum_audio.pause();
	drum_audio.currentTime = 0;
	yomiage_flag = false;
	for(var i = 0;i < 8;i++){
		document.getElementById("d"+i+"-dt").style.backgroundColor = td_background_color;
	}
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
function get_syori(){
	var result = GetQueryString();
	var get_lat = result["lat"];
	var get_lng = result["lng"];
	var get_zoom = result["zoom"];
	if(get_lat != undefined && get_lng != undefined && get_zoom != undefined) return [eval(get_lat),eval(get_lng),eval(get_zoom)];
	return "error";
}
function lang_get_syori(){
	var result = GetQueryString();
	var lang = result["lang"];
	if(lang == "ja" || lang == "en") return lang;
	return "ja";
}
function error_confirm(){
	if(lang == "ja"){
		if(confirm("手動で位置を指定しますか？")){
			location.href = "./manual/index.php?lang="+lang;
		}else{
			alert("あなたは、天気予報の情報を取得することはできません。\nブラウザーを変えて見てください。")
		}
	}
	if(lang == "en"){
		if(confirm("Do you acquire a coordinate manually?")){
			location.href = "./manual/index.php?lang="+lang;
		}else{
			alert("You can't acquire information on a weather forecast.\nPlease change and see a browser.");
		}
	}
}
function wind_deg(deg){
	if(lang == "ja") var wind_direction = ["南","南南西","南西","西南西","西","西北西","北西","北北西","北","北北東","北東","東北東","東","東南東","南東","南南東"];
	if(lang == "ja") var wind_direction_kana = ["みなみ","なんなんせい","なんせい","せいなんせい","にし","せいほくせい","ほくせい","ほくほくせい","きた","ほくほくとう","ほくとう","とうほくとう","ひがし","とうなんとう","なんとう","なんなんとう"];
	if(lang == "en") var wind_direction = ["south","south-southwest","southwest","west-southwest","west","west-northwest","northwest","north-northwest","North","north-northeast","northeast","east-northeast","east","east-southeast","Southeast","south-southeast"];
	deg += 360/32;
	deg %= 360;
	if(lang == "ja") return [wind_direction[Math.floor(deg/(360/16))],wind_direction_kana[Math.floor(deg/(360/16))]];
	if(lang == "en") return [wind_direction[Math.floor(deg/(360/16))],wind_direction[Math.floor(deg/(360/16))]];
}
function mon_to_en(mon){
	var en = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
	return en[mon - 1];
}
function lang_chg(){
	var center = map.getCenter();
	var lat = center.lat();
	var lng = center.lng();
	var zoom = map.getZoom();

	if(!zahyou_manual){
		document.location = "./?lang="+document.getElementById("lang").value+"&lat="+lat+"&lng="+lng+"&zoom="+zoom;
	}else{
		document.location = "./?lang="+document.getElementById("lang").value+"&lat="+lat+"&lng="+lng+"&zoom="+zoom;
	}
}
function start_audio_play(){
	if(yomiage_count == 1){
		opening_audio.addEventListener("ended", secound_audio_play, false);
		opening_audio.play();
	}else{
		secound_audio_play();
	}
}
function secound_audio_play(){
	if(wav_ok){
		audio = new Audio("data:audio/wav;base64," + audio_data);
		audio.addEventListener("ended", audio_stop, false);
		audio.play();
		drum_audio.play();
	}else{
		var bin = atob(audio_data);
		var buffer = new Uint8Array(bin.length);
		for (var i = 0; i < bin.length; i++) {
			buffer[i] = bin.charCodeAt(i);
		}
		var data = parseWav(buffer);
		console.log(data);
		worker_libmp3lame.postMessage({ cmd: 'init', config:{
			mode : 3,
			channels:1,
			samplerate: data.sampleRate,
			bitlate: data.bitsPerSample
		}});
		worker_libmp3lame.postMessage({ cmd: 'encode', buf: Uint8ArrayToFloat32Array(data.samples) });
		worker_libmp3lame.postMessage({ cmd: 'finish'});
		worker_libmp3lame.onmessage = function(e) {
			if (e.data.cmd == 'data') {
				audio = new Audio();
				audio.src = 'data:audio/mp3;base64,'+encode64(e.data.buf);
				audio.addEventListener("ended", audio_stop, false);
				audio.play();
				drum_audio.play();
			}
		}
	}
}
function jump_to_manually_setting(){
	var zoom = map.getZoom();
	var latlng = map.getCenter();
	var lat = latlng.lat();
	var lng = latlng.lng();
	location.href = "./manual?lang="+lang+"&lat="+lat+"&lng="+lng+"&zoom="+zoom;
}
//ここから先WAVEエンコード関連
function parseWav(wav) {
	function readInt(i, bytes) {
		var ret = 0,shft = 0;
		while (bytes) {
			ret += wav[i] << shft;
			shft += 8;
			i++;
			bytes--;
		}
		return ret;
	}
	if (readInt(20, 2) != 1) throw 'Invalid compression code, not PCM';
	if (readInt(22, 2) != 1) throw 'Invalid number of channels, not 1';
	return {
		sampleRate: readInt(24, 4),
		bitsPerSample: readInt(34, 2),
		samples: wav.subarray(44)
	};
}
function Uint8ArrayToFloat32Array(u8a){
	var f32Buffer = new Float32Array(u8a.length/2);
	for (var i = 0; i < u8a.length/2; i++) {
		var value = u8a[i<<1] + (u8a[(i<<1)+1]<<8);
		if (value >= 0x8000) value |= ~0x7FFF;
		f32Buffer[i] = value / 0x8000;
	}
	return f32Buffer;
}
function encode64(buffer) {
	var binary = '';
	var bytes = new Uint8Array( buffer );
	var len = bytes.byteLength;
	for (var i = 0; i < len; i++) {
		binary += String.fromCharCode( bytes[ i ] );
	}
	return window.btoa( binary );
}