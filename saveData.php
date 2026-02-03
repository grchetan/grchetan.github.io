// saveData.php
<?php
$data = json_decode(file_get_contents('php://input'), true);
$file = 'userData.json';

if (file_exists($file)) {
    $currentData = json_decode(file_get_contents($file), true);
} else {
    $currentData = [];
}

$currentData[] = $data;
file_put_contents($file, json_encode($currentData, JSON_PRETTY_PRINT));

http_response_code(200);
?>