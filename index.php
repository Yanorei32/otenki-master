<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
		<meta http-equiv="Content-Script-Type" content="text/javascript">
		<link rev="made" href="mailto:yanorei@hotmail.co.jp">
		<link href="../css/4.2.css" rel="stylesheet">
		<script type="text/javascript" src="main.js"></script>
		<script type="text/javascript" src="../js/jquery.js"></script>
		<?php
			$lang = "";
			if($_GET["lang"] == "" || $_GET["lang"] == false || $_GET["lang"] == null || $_GET["lang"] == "ja"){
				$lang = "ja";
			}else{
				$lang = "en";
			}
			echo "<script type=\"text/javascript\" src=\"http://maps.googleapis.com/maps/api/js?sensor=true&language=".$lang."\"></script>";
		?>
		<title id="page_title">天気予報</title>
	</head>
	<body onload="load_()">
		<img src="../img/LOGO_ja.png" height="50px" id="logo"><br>
		<span id="lang_select">言語：</span>
		<select id="lang" onchange="lang_chg()">
			<option value="ja">日本語</option>
			<option value="en">English</option>
		</select>
		<div id="main">
		</div>
	</body>
</html>