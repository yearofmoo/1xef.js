<?php

  sleep(10);

?>
<div class="xef-response">
  <div class="xef-content">
<?php

function rand_string( $length ) {
	$chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";	

	$size = strlen( $chars );
	for( $i = 0; $i < $length; $i++ ) {
    $str .= ' ';
		$str .= $chars[ rand( 0, $size - 1 ) ];
	}

	return $str;
}

echo rand_string(1000);

?>
  </div>
  <div class="xef-header">
    { xef : { assets : ['./demo1_asset.js?941'] } }
  </div>
</div>
