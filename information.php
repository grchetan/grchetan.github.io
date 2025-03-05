<?php

$server  = "localhost";  
$username = "root";
$password  = "";
$dbname  = "videoeditingdata";

$con = mysqli_connect($server, $username, $password, $dbname);

if (!$con) {
    die("Connection failed: " . mysqli_connect_error());  // ✅ Proper error message
} else {
    echo "Connected<br>";
}

// Start
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = $_POST['name'] ?? '';
    $email = $_POST['email'] ?? '';
    $number = $_POST['number'] ?? '';
    $resume_link = $_POST['resume_link'] ?? '';
    $skills = $_POST['skills'] ?? '';

    if (!empty($name) && !empty($email) && !empty($number)) {
        $sql = "INSERT INTO `information`(`name`, `email`, `contact`, `resumelink`, `skills`) 
                VALUES ('$name','$email','$number','$resume_link','$skills');";

        if (mysqli_query($con, $sql)) {
            echo "Data submitted successfully!";
        } else {
            echo "Error: " . mysqli_error($con);  // ✅ Show actual error
        }
    } else {
        echo "All fields are required!";
    }
} else {
    echo "Invalid Request!";
}

mysqli_close($con);
?>
