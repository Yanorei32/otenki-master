<?php
	if($_GET["q"]){
		$q = $_GET["q"];
		$xml_res = file_get_contents('http://www.geocoding.jp/api/?q='.$q);
		$xml_Data = new SimpleXMLElement($xml_res);
		echo (string)$xml_Data->coordinate->lat.",".(string)$xml_Data->coordinate->lng;
	}else{
		die("error");
	}
?>