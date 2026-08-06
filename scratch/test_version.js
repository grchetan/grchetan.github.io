async function test() {
  const urlVersion = "https://grchetan-github-io.vercel.app/version.json";
  console.log("Fetching version.json:", urlVersion);
  try {
    const res = await fetch(urlVersion);
    const data = await res.json();
    console.log("Version Data:", data);
  } catch (err) {
    console.error("Error version fetch:", err.message);
  }
}

test();
