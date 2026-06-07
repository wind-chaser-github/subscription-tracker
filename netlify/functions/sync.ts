import { getStore } from "@netlify/blobs";

export const handler = async (event: any) => {
  // Use Netlify Blobs as our "invisible drawer"
  const store = getStore("subscription-data");

  if (event.httpMethod === "GET") {
    try {
      const data = await store.get("latest", { type: "json" });
      return {
        statusCode: 200,
        body: JSON.stringify(data || {}),
      };
    } catch (err) {
      return { statusCode: 500, body: String(err) };
    }
  }

  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body);
      await store.setJSON("latest", body);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      };
    } catch (err) {
      return { statusCode: 500, body: String(err) };
    }
  }

  return { statusCode: 405, body: "Method Not Allowed" };
};
