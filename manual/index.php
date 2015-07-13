<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
		<meta http-equiv="Content-Script-Type" content="text/javascript">
		<link rev="made" href="mailto:yanorei@hotmail.co.jp">
		<script type="text/javascript" src="main.js"></script>
		<?php
			$lang = "";
			if($_GET["lang"] == "" || $_GET["lang"] == false || $_GET["lang"] == null || $_GET["lang"] == "ja"){
				$lang = "ja";
			}else{
				$lang = "en";
			}
			echo '<script type="text/javascript" src="http://maps.googleapis.com/maps/api/js?sensor=true&language='.$lang.'"></script>';
		?>
		<link href="style.css" rel="stylesheet">
		<title>The Title</title>
	</head>
	<body onload="load()">
		<img src="../img/LOGO_ja.png" height="50px" id="logo"><br>
		<span id="lang_select">言語：</span>
		<select id="lang" onchange="lang_chg()">
			<option value="ja">日本語</option>
			<option value="en">English</option>
		</select><br>
		<span id="msg">天気を取得したい場所を地図の中央に持っていってください。</span><br>
		<div id="map"></div>
		<div id="map2"></div>
		<input type="text" id="addresssearch_address" placeholder="住所">
		<input type="button" value="移動" id="addresssearch_button" onclick="addresssearch_address()"><br>
		<input type="button" value="決定" onclick="map_latlng_get()" id="syutoku"><br>
		<hr>
		<table>
			<tr>
				<td>
					<h3 id="favo_message">お気に入り</h3>
				</td>
				<td>
					<select id="preset_select">
						<option value="0">東京</option>
					</select>
					<input type="button" value="移動" onclick="preset_cont()" id="preset_move" style="margin-bottom : 3px;" class="favo_button">
					<input type="button" value="削除" onclick="preset_delete()" id="preset_delete" class="favo_button">
					<br>
					<input type="textbox" id="preset_name" placeholder="名前">
					<input type="button" value="登録" onclick="preset_plus()" id="preset_plus" class="favo_button">
				</td>
			</tr>
		</table>
	</body>
</html>
