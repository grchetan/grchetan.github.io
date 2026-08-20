export default async function handler(req, res) {
  // Allow CORS from any origin
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const username = req.query.username || (req.body && req.body.variables && req.body.variables.username) || "chetanprajapat07";

  const graphqlQuery = `
    query userPublicProfile($username: String!) {
      matchedUser(username: $username) {
        profile { ranking }
        submitStatsGlobal {
          acSubmissionNum { difficulty count }
        }
        submitStats {
          acSubmissionNum { difficulty count }
        }
        userCalendar { streak totalActiveDays submissionCalendar }
      }
    }
  `;

  try {
    const leetcodeRes = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        Referer: `https://leetcode.com/u/${username}/`,
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: { username },
      }),
    });

    if (!leetcodeRes.ok) {
      return res.status(leetcodeRes.status).json({ error: "LeetCode API returned error" });
    }

    const data = await leetcodeRes.json();
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to fetch from LeetCode" });
  }
}
