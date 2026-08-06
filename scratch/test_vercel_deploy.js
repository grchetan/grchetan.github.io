async function test() {
  const urlJs = "https://grchetan-github-io.vercel.app/assets/index-C93lqRmL.js";

  console.log("Fetching JS:", urlJs);
  try {
    const res = await fetch(urlJs);
    console.log("JS Status:", res.status);
    console.log("JS Content-Type:", res.headers.get("content-type"));
  } catch (err) {
    console.error("Error JS fetch:", err.message);
  }
}

test();
