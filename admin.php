<?php
session_start();

// Login System
if (isset($_POST['username']) && isset($_POST['password'])) {
    if ($_POST['username'] === 'chetan' && $_POST['password'] === 'admin123') {
        $_SESSION['loggedin'] = true;
        header('Location: ?page=admin');
        exit;
    } else {
        $error = "Username galat, password galat, tu kaun bhai?";
    }
}

// Logout System
if (isset($_GET['page']) && $_GET['page'] === 'logout') {
    session_destroy();
    header('Location: ?page=login');
    exit;
}

// Protect Admin Page
if (!isset($_SESSION['loggedin']) && $_GET['page'] !== 'login') {
    header('Location: ?page=login');
    exit;
}

// User Data JSON File
$dataFile = 'userData.json';
$data = json_decode(file_get_contents($dataFile), true) ?? [];

// Track Visitor Data
if (isset($_GET['screen'])) {
    $ip = $_SERVER['REMOTE_ADDR'];
    if ($ip === '152.58.41.235') exit;

    $location = "Unknown";
    $geoData = @file_get_contents("http://ip-api.com/json/{$ip}");
    if ($geoData) {
        $geoData = json_decode($geoData, true);
        if ($geoData['status'] === 'success') {
            $location = $geoData['city'] . ', ' . $geoData['country'];
        }
    }

    $browser = $_SERVER['HTTP_USER_AGENT'];
    $platform = PHP_OS;
    $screenSize = $_GET['screen'];
    $visitTime = date('d/m/Y, H:i:s');

    $data[] = [
        'ip' => $ip,
        'location' => $location,
        'device' => [
            'browser' => $browser,
            'platform' => $platform,
            'screenSize' => $screenSize
        ],
        'visitTime' => $visitTime
    ];

    file_put_contents($dataFile, json_encode($data));
    exit;
}

// Clear All Data
if (isset($_GET['clear'])) {
    file_put_contents($dataFile, json_encode([]));
    header('Location: ?page=admin');
    exit;
}

// Delete Individual Visitor Data
if (isset($_GET['delete']) && isset($_GET['id'])) {
    unset($data[$_GET['id']]);
    file_put_contents($dataFile, json_encode(array_values($data)));
    header('Location: ?page=admin');
    exit;
}

// Edit Visitor Data
if (isset($_POST['update'])) {
    $id = $_POST['id'];
    $data[$id]['location'] = $_POST['location'];
    $data[$id]['device']['browser'] = $_POST['browser'];
    $data[$id]['device']['platform'] = $_POST['platform'];
    $data[$id]['device']['screenSize'] = $_POST['screenSize'];
    $data[$id]['visitTime'] = $_POST['visitTime'];

    file_put_contents($dataFile, json_encode($data));
    header('Location: ?page=admin');
    exit;
}

?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Panel | Visitor Tracking</title>
  <link rel="stylesheet" href="style.css">
  <style>
/* Global Style */
body {
  font-family: 'Poppins', sans-serif;
  background: linear-gradient(135deg, #1e1e2f, #1f2235  );
  color: white;
  margin: 0;
  padding: 0;
}

/* Login Box */
.login-box {
  max-width: 450px;
  margin: 100px auto;
  padding: 40px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;

}

.login-box:hover {
  transform: translateY(-5px);
}

input[type="text"],
input[type="password"] {
  width: 90%;
  padding: 10px;
  margin-bottom: 15px;
  background: transparent;
  border: 1px solid #ddd;
  color: white;
  border-radius: 8px;
  outline: none;
}

button {
  width: 100px;
  padding: 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease;
}

button:hover {
  background-color: #0056b3;
}

/* Admin Panel */
.admin-panel {
  padding: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  border-radius: 12px;
  overflow: hidden;
}

th, td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

th {
  background-color: #007bff;
  color: white;
}

td a {
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
}

.logout-btn {
  background-color: #dc3545;
  padding: 5px;
  color: white;
}

.clear-btn {
  background-color: #ffc107;
  color: black;
  padding: 5px;
}

.edit-btn {
  background-color: #17a2b8;
  color: white;
  margin: 10px;
}

td a:hover {
  opacity: 0.8;
  transform: scale(1.05);
  transition: all 0.2s ease-in-out;
}

footer {
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  text-align: center;
  padding: 15px 0;


}

footer p {
  margin: 5px 0;
  font-size: 14px;
}

.footer-links {
  margin-top: 8px;
}

.footer-links a {
  text-decoration: none;
  color: #00bcd4;
  margin: 0 10px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.footer-links a:hover {
  text-decoration: underline;
  color: #00e5ff;
}


/* Responsive Design */
@media (max-width: 600px) {
  .login-box {
    width: 90%;
  }

  table {
    font-size: 14px;
  }
}

  </style>
</head>
<body>

<?php if ($_GET['page'] === 'login'): ?>
  <div class="login-box">
    <h2>Admin Login</h2>
    <form method="POST">
      <input type="text" name="username" placeholder="Username" required>
      <input type="password" name="password" placeholder="Password" required>
      <button type="submit">Login</button>
    </form>
    <?php if (isset($error)) echo "<p>$error</p>"; ?>
  </div>

<?php elseif ($_GET['page'] === 'admin'): ?>

  <div class="admin-panel">
    <h1>Visitor Tracking System</h1>

    <table>
      <tr>
        <th>IP Address</th>
        <th>Location</th>
        <th>Browser</th>
        <th>Platform</th>
        <th>Screen Size</th>
        <th>Visit Time</th>
        <th>Action</th>
      </tr>
      <?php foreach ($data as $index => $user): ?>
        <tr>
          <td><?= $user['ip'] ?></td>
          <td><?= $user['location'] ?></td>
          <td><?= $user['device']['browser'] ?></td>
          <td><?= $user['device']['platform'] ?></td>
          <td><?= $user['device']['screenSize'] ?></td>
          <td><?= $user['visitTime'] ?></td>
          <td>
            <a href="?page=admin&edit=<?= $index ?>" class="edit-btn">Edit</a>
            <a href="?page=admin&delete=true&id=<?= $index ?>" class="delete-btn">Delete</a>
          </td>
        </tr>
      <?php endforeach; ?>
    </table>

    <br>
    <a href="?page=logout" class="logout-btn">Logout</a>
    <a href="?clear=true" class="clear-btn">Clear All Data</a>

    <?php if (isset($_GET['edit'])): 
      $id = $_GET['edit'];
      $user = $data[$id];
    ?>
      <h2>Edit Visitor Data</h2>
      <form method="POST">
        <input type="hidden" name="id" value="<?= $id ?>">
        <input type="text" name="location" value="<?= $user['location'] ?>" required>
        <input type="text" name="browser" value="<?= $user['device']['browser'] ?>" required>
        <input type="text" name="platform" value="<?= $user['device']['platform'] ?>" required>
        <input type="text" name="screenSize" value="<?= $user['device']['screenSize'] ?>" required>
        <input type="text" name="visitTime" value="<?= $user['visitTime'] ?>" required>
        <button type="submit" name="update">Update</button>
      </form>
    <?php endif; ?>

  </div>

<?php endif; ?>

<footer>
  <p>© 2025 Chetan Prajapat | All Rights Reserved</p>
  <div class="footer-links">
  </div>
</footer>

</body>
</html>

